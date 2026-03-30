import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from os import getenv
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GMAIL_EMAIL = getenv("GMAIL_EMAIL")
GMAIL_APP_PASSWORD = getenv("GMAIL_APP_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_TIMEOUT_SECONDS = 10

# Validate configuration
if not GMAIL_EMAIL or not GMAIL_APP_PASSWORD:
    print("[WARN] Email configuration incomplete. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env")

def send_otp_email(recipient_email: str, otp: str):
    """Send OTP via Gmail"""
    try:
        subject = "Your 2FA OTP - AI Sentiment Forecaster"
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #0dcbf2; text-align: center;">Two-Factor Authentication</h2>
                    <p style="color: #333; font-size: 16px;">Hi,</p>
                    <p style="color: #666;">Your One-Time Password (OTP) for login is:</p>
                    <div style="background-color: #0dcbf2; color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        {otp}
                    </div>
                    <p style="color: #999; font-size: 14px;">This OTP will expire in 5 minutes.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">© 2026 AI Sentiment Forecaster. All rights reserved.</p>
                </div>
            </body>
        </html>
        """

        _send_email(recipient_email, subject, html_body)
        return True
    except Exception as e:
        print(f"[FAIL] Failed to send OTP email: {str(e)}")
        return False

def send_password_reset_email(recipient_email: str, reset_token: str, reset_link: str):
    """Send password reset link via Gmail"""
    try:
        subject = "Password Reset - AI Sentiment Forecaster"
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #0dcbf2; text-align: center;">Password Reset Request</h2>
                    <p style="color: #333; font-size: 16px;">Hi,</p>
                    <p style="color: #666;">We received a request to reset your password. Click the button below to reset it:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background-color: #0dcbf2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #666;">Or copy this link: <br><span style="color: #0dcbf2; word-break: break-all;">{reset_link}</span></p>
                    <p style="color: #999; font-size: 14px;">This link will expire in 30 minutes.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">© 2026 AI Sentiment Forecaster. All rights reserved.</p>
                </div>
            </body>
        </html>
        """

        _send_email(recipient_email, subject, html_body)
        return True
    except Exception as e:
        print(f"[FAIL] Failed to send password reset email: {str(e)}")
        return False

def _send_email(recipient_email: str, subject: str, html_body: str):
    """Internal method to send email via Gmail SMTP"""
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = GMAIL_EMAIL
        message["To"] = recipient_email

        # Attach HTML body
        part = MIMEText(html_body, "html")
        message.attach(part)

        # Send via Gmail SMTP
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS)
        server.starttls()
        server.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_EMAIL, recipient_email, message.as_string())
        server.quit()

        print(f"[OK] Email sent to {recipient_email}")
    except Exception as e:
        print(f"[FAIL] SMTP Error: {str(e)}")
        raise
