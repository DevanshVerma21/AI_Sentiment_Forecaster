"""Simple post-deploy smoke test for backend health and CORS."""
from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Iterable

import requests


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def _normalize_base_url(url: str) -> str:
    return url.rstrip("/")


def _check_get(session: requests.Session, base_url: str, path: str, expected: Iterable[int]) -> CheckResult:
    url = f"{base_url}{path}"
    try:
        response = session.get(url, timeout=20)
        ok = response.status_code in set(expected)
        return CheckResult(
            name=f"GET {path}",
            ok=ok,
            detail=f"status={response.status_code}",
        )
    except Exception as exc:
        return CheckResult(name=f"GET {path}", ok=False, detail=f"error={exc}")


def _check_cors(session: requests.Session, base_url: str, path: str, origin: str) -> CheckResult:
    url = f"{base_url}{path}"
    try:
        response = session.options(
            url,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
            timeout=20,
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
            "https://ai-sentiment-forecaster.onrender.com,https://ai-infosys-frontend.onrender.com",
        ),
        help="Comma-separated frontend origins to test CORS",
    )
    args = parser.parse_args()

    base_url = _normalize_base_url(args.backend_url)
    origins = [o.strip() for o in args.origins.split(",") if o.strip()]

    session = requests.Session()
    results: list[CheckResult] = []

    results.append(_check_get(session, base_url, "/", {200}))
    results.append(_check_get(session, base_url, "/healthz", {200}))
    results.append(_check_get(session, base_url, "/api/health", {200}))

    for origin in origins:
        results.append(_check_cors(session, base_url, "/api/health", origin))

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
