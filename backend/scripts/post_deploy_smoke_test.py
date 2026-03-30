"""Simple post-deploy smoke test for backend health and CORS."""
from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass
from typing import Iterable

import requests


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def _request_with_retries(
    session: requests.Session,
    method: str,
    url: str,
    *,
    timeout: int,
    retries: int,
    retry_delay: float,
    headers: dict | None = None,
) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return session.request(method, url, headers=headers, timeout=timeout)
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(retry_delay)
    assert last_error is not None
    raise last_error


def _normalize_base_url(url: str) -> str:
    return url.rstrip("/")


def _check_get(
    session: requests.Session,
    base_url: str,
    path: str,
    expected: Iterable[int],
    timeout: int,
    retries: int,
    retry_delay: float,
) -> CheckResult:
    url = f"{base_url}{path}"
    try:
        response = _request_with_retries(
            session,
            "GET",
            url,
            timeout=timeout,
            retries=retries,
            retry_delay=retry_delay,
        )
        ok = response.status_code in set(expected)
        return CheckResult(
            name=f"GET {path}",
            ok=ok,
            detail=f"status={response.status_code}",
        )
    except Exception as exc:
        return CheckResult(name=f"GET {path}", ok=False, detail=f"error={exc}")


def _check_cors(
    session: requests.Session,
    base_url: str,
    path: str,
    origin: str,
    timeout: int,
    retries: int,
    retry_delay: float,
) -> CheckResult:
    url = f"{base_url}{path}"
    try:
        response = _request_with_retries(
            session,
            "OPTIONS",
            url,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
            timeout=timeout,
            retries=retries,
            retry_delay=retry_delay,
        )
        allow_origin = response.headers.get("access-control-allow-origin")
        ok = response.status_code in {200, 204} and allow_origin == origin
        return CheckResult(
            name=f"CORS {origin}",
            ok=ok,
            detail=f"status={response.status_code}, allow-origin={allow_origin}",
        )
    except Exception as exc:
        return CheckResult(name=f"CORS {origin}", ok=False, detail=f"error={exc}")


def main() -> int:
    default_frontend_origin = os.getenv("FRONTEND_URL", "https://ai-sentiment-forecaster.onrender.com")

    parser = argparse.ArgumentParser(description="Run backend smoke tests after deployment")
    parser.add_argument(
        "--backend-url",
        default=os.getenv("BACKEND_URL", "https://ai-sentiment-forecaster-backend.onrender.com"),
        help="Backend base URL",
    )
    parser.add_argument(
        "--origins",
        default=os.getenv(
            "CORS_TEST_ORIGINS",
            default_frontend_origin,
        ),
        help="Comma-separated frontend origins to test CORS",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=int(os.getenv("SMOKE_TIMEOUT", "45")),
        help="Per-request timeout in seconds",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=int(os.getenv("SMOKE_RETRIES", "3")),
        help="Retry attempts per check",
    )
    parser.add_argument(
        "--retry-delay",
        type=float,
        default=float(os.getenv("SMOKE_RETRY_DELAY", "5")),
        help="Delay in seconds between retries",
    )
    args = parser.parse_args()

    base_url = _normalize_base_url(args.backend_url)
    origins = [o.strip() for o in args.origins.split(",") if o.strip()]

    session = requests.Session()
    results: list[CheckResult] = []

    results.append(_check_get(session, base_url, "/", {200}, args.timeout, args.retries, args.retry_delay))
    results.append(_check_get(session, base_url, "/healthz", {200}, args.timeout, args.retries, args.retry_delay))
    results.append(_check_get(session, base_url, "/api/health", {200}, args.timeout, args.retries, args.retry_delay))

    for origin in origins:
        results.append(_check_cors(session, base_url, "/api/health", origin, args.timeout, args.retries, args.retry_delay))

    failed = [r for r in results if not r.ok]

    print("Post-deploy smoke test results")
    print("=" * 32)
    for result in results:
        status = "PASS" if result.ok else "FAIL"
        print(f"[{status}] {result.name} -> {result.detail}")

    if failed:
        print("\nOne or more checks failed.")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
