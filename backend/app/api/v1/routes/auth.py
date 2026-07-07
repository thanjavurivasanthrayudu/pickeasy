"""
MotoEase - Authentication Routes
Handles: register, login, refresh, logout, OTP, forgot/reset password.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.middleware.auth_middleware import handle_errors
from app.services.auth_service import AuthService
from app.utils.exceptions import ValidationError

auth_bp = Blueprint("auth", __name__)


def _validate_required(data: dict, fields: list[str]):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        raise ValidationError(f"Missing required fields: {', '.join(missing)}")


# ── POST /api/v1/auth/register ────────────────────────────────────────────────

@auth_bp.post("/register")
@handle_errors
def register():
    """Register a new customer, mechanic, or admin user."""
    data = request.get_json(force=True) or {}
    _validate_required(data, ["full_name", "email", "phone", "password"])

    if len(data.get("password", "")) < 8:
        raise ValidationError("Password must be at least 8 characters.")

    result = AuthService.register(data)
    return jsonify({"success": True, "message": "Registered successfully.", "data": result}), 201


# ── POST /api/v1/auth/login ───────────────────────────────────────────────────

@auth_bp.post("/login")
@handle_errors
def login():
    """Authenticate user and return JWT tokens."""
    data = request.get_json(force=True) or {}
    _validate_required(data, ["email_or_phone", "password"])

    ip = request.remote_addr
    ua = request.headers.get("User-Agent", "")
    result = AuthService.login(data["email_or_phone"], data["password"], ip=ip, ua=ua)
    return jsonify({"success": True, "message": "Login successful.", "data": result}), 200


# ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────

@auth_bp.post("/refresh")
@jwt_required(refresh=True)
@handle_errors
def refresh():
    """Issue a new access token using a valid refresh token."""
    identity = get_jwt_identity()
    jti = get_jwt()["jti"]
    tokens = AuthService.refresh_tokens(identity, jti)
    return jsonify({"success": True, "data": tokens}), 200


# ── POST /api/v1/auth/logout ──────────────────────────────────────────────────

@auth_bp.post("/logout")
@jwt_required(refresh=True)
@handle_errors
def logout():
    """Revoke the current refresh token."""
    jti = get_jwt()["jti"]
    AuthService.logout(jti)
    return jsonify({"success": True, "message": "Logged out successfully."}), 200


# ── POST /api/v1/auth/send-otp ────────────────────────────────────────────────

@auth_bp.post("/send-otp")
@handle_errors
def send_otp():
    """Send an OTP to the user's phone for verification."""
    data = request.get_json(force=True) or {}
    _validate_required(data, ["user_id", "purpose"])
    result = AuthService.send_otp(data["user_id"], data["purpose"])
    return jsonify({"success": True, **result}), 200


# ── POST /api/v1/auth/verify-otp ─────────────────────────────────────────────

@auth_bp.post("/verify-otp")
@handle_errors
def verify_otp():
    """Verify an OTP code."""
    data = request.get_json(force=True) or {}
    _validate_required(data, ["user_id", "code", "purpose"])
    result = AuthService.verify_otp(data["user_id"], data["code"], data["purpose"])
    return jsonify({"success": True, **result}), 200


# ── POST /api/v1/auth/forgot-password ────────────────────────────────────────

@auth_bp.post("/forgot-password")
@handle_errors
def forgot_password():
    """Send OTP to registered email/phone for password reset."""
    data = request.get_json(force=True) or {}
    _validate_required(data, ["email_or_phone"])
    result = AuthService.forgot_password(data["email_or_phone"])
    return jsonify({"success": True, **result}), 200


# ── POST /api/v1/auth/reset-password ─────────────────────────────────────────

@auth_bp.post("/reset-password")
@handle_errors
def reset_password():
    """Reset password using OTP."""
    data = request.get_json(force=True) or {}
    _validate_required(data, ["user_id", "otp_code", "new_password"])

    if len(data["new_password"]) < 8:
        raise ValidationError("Password must be at least 8 characters.")

    result = AuthService.reset_password(data["user_id"], data["otp_code"], data["new_password"])
    return jsonify({"success": True, **result}), 200


# ── POST /api/v1/auth/change-password ────────────────────────────────────────

@auth_bp.post("/change-password")
@jwt_required()
@handle_errors
def change_password():
    """Change password for authenticated user."""
    identity = get_jwt_identity()
    data = request.get_json(force=True) or {}
    _validate_required(data, ["old_password", "new_password"])
    result = AuthService.change_password(identity, data["old_password"], data["new_password"])
    return jsonify({"success": True, **result}), 200
