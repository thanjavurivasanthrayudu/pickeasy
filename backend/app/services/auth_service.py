"""
MotoEase - Authentication Service

Handles user registration, login, JWT token management, OTP, password reset.
"""
import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from flask import current_app
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_jwt_extended import (create_access_token, create_refresh_token,
                                 decode_token)
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.user import OTP, OTPPurpose, RefreshToken, User, UserRole, UserStatus
from app.services.notification_service import NotificationService
from app.utils.exceptions import (AuthError, ConflictError, NotFoundError,
                                   ValidationError)


class AuthService:
    """Handles all authentication-related business logic."""

    # ── Register ──────────────────────────────────────────────────────────────

    @staticmethod
    def register(data: dict) -> dict:
        """
        Register a new user.

        Args:
            data: dict with full_name, email, phone, password, role
        Returns:
            dict with user info and tokens
        """
        role = data.get("role", UserRole.CUSTOMER)
        if role not in [r.value for r in UserRole]:
            raise ValidationError("Invalid role. Must be customer, mechanic, or admin.")

        # Check uniqueness
        if User.query.filter_by(email=data["email"]).first():
            raise ConflictError("A user with this email already exists.")
        if User.query.filter_by(phone=data["phone"]).first():
            raise ConflictError("A user with this phone number already exists.")

        password_hash = generate_password_hash(data["password"]).decode("utf-8")

        user = User(
            id=str(uuid.uuid4()),
            full_name=data["full_name"],
            email=data["email"].lower().strip(),
            phone=data["phone"].strip(),
            password_hash=password_hash,
            role=role,
            status=UserStatus.ACTIVE,
        )
        db.session.add(user)

        # Create role-specific profile
        if role == UserRole.CUSTOMER:
            from app.models.vehicle import Customer  # local import to avoid circular
            import uuid as _uuid
            customer = Customer(id=str(_uuid.uuid4()), user_id=user.id)
            db.session.add(customer)
        elif role == UserRole.MECHANIC:
            from app.models.mechanic import Mechanic, MechanicStatus
            import uuid as _uuid
            mechanic = Mechanic(
                id=str(_uuid.uuid4()),
                user_id=user.id,
                status=MechanicStatus.PENDING,
            )
            db.session.add(mechanic)

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise ConflictError("User already exists.")

        # Generate OTP for phone verification
        AuthService._create_otp(user, OTPPurpose.PHONE_VERIFY)

        tokens = AuthService._generate_tokens(user)
        return {"user": AuthService._serialize_user(user), **tokens}

    # ── Login ─────────────────────────────────────────────────────────────────

    @staticmethod
    def login(email_or_phone: str, password: str, ip: str = None, ua: str = None) -> dict:
        """Authenticate with email/phone and password."""
        user = (
            User.query.filter_by(email=email_or_phone.lower().strip()).first()
            or User.query.filter_by(phone=email_or_phone.strip()).first()
        )

        if not user or not check_password_hash(user.password_hash, password):
            raise AuthError("Invalid credentials.")

        if user.status == UserStatus.SUSPENDED:
            raise AuthError("Account suspended. Contact support.")

        if user.is_deleted:
            raise AuthError("Account no longer exists.")

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        tokens = AuthService._generate_tokens(user, ip=ip, ua=ua)
        return {"user": AuthService._serialize_user(user), **tokens}

    # ── Token Refresh ─────────────────────────────────────────────────────────

    @staticmethod
    def refresh_tokens(identity: str, jti: str) -> dict:
        """Issue new access + refresh token pair, revoke old one."""
        user = User.query.get(identity)
        if not user:
            raise NotFoundError("User not found.")

        # Revoke old refresh token
        old_token = RefreshToken.query.filter_by(jti=jti).first()
        if old_token:
            old_token.revoked = True
            db.session.commit()

        return AuthService._generate_tokens(user)

    # ── Logout ────────────────────────────────────────────────────────────────

    @staticmethod
    def logout(jti: str) -> None:
        """Revoke the refresh token associated with the given JTI."""
        token = RefreshToken.query.filter_by(jti=jti).first()
        if token:
            token.revoked = True
            db.session.commit()

    # ── OTP ───────────────────────────────────────────────────────────────────

    @staticmethod
    def send_otp(user_id: str, purpose: str) -> dict:
        """Generate and send OTP."""
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError("User not found.")

        otp_record = AuthService._create_otp(user, purpose)
        # In production: send via Twilio / Firebase / SMTP
        return {"message": "OTP sent successfully", "expires_in": 300}

    @staticmethod
    def verify_otp(user_id: str, code: str, purpose: str) -> dict:
        """Verify OTP code."""
        otp = (
            OTP.query.filter_by(user_id=user_id, code=code, purpose=purpose, is_used=False)
            .order_by(OTP.created_at.desc())
            .first()
        )

        if not otp:
            raise ValidationError("Invalid OTP.")

        if datetime.now(timezone.utc) > otp.expires_at.replace(tzinfo=timezone.utc):
            raise ValidationError("OTP has expired.")

        otp.is_used = True
        db.session.commit()

        user = User.query.get(user_id)
        if purpose == OTPPurpose.PHONE_VERIFY:
            user.is_phone_verified = True
        elif purpose == OTPPurpose.EMAIL_VERIFY:
            user.is_email_verified = True
        db.session.commit()

        return {"message": "OTP verified successfully."}

    # ── Password ──────────────────────────────────────────────────────────────

    @staticmethod
    def forgot_password(email_or_phone: str) -> dict:
        """Send OTP for password reset."""
        user = (
            User.query.filter_by(email=email_or_phone.lower().strip()).first()
            or User.query.filter_by(phone=email_or_phone.strip()).first()
        )
        if not user:
            # Don't reveal existence
            return {"message": "If an account exists, an OTP has been sent."}

        AuthService._create_otp(user, OTPPurpose.FORGOT_PASSWORD)
        return {"message": "OTP sent if account exists.", "user_id": user.id}

    @staticmethod
    def reset_password(user_id: str, otp_code: str, new_password: str) -> dict:
        """Reset password after OTP verification."""
        AuthService.verify_otp(user_id, otp_code, OTPPurpose.FORGOT_PASSWORD)

        user = User.query.get(user_id)
        if not user:
            raise NotFoundError("User not found.")

        user.password_hash = generate_password_hash(new_password).decode("utf-8")
        db.session.commit()
        return {"message": "Password reset successfully."}

    @staticmethod
    def change_password(user_id: str, old_password: str, new_password: str) -> dict:
        """Change password for authenticated user."""
        user = User.query.get(user_id)
        if not user or not check_password_hash(user.password_hash, old_password):
            raise AuthError("Old password is incorrect.")

        user.password_hash = generate_password_hash(new_password).decode("utf-8")
        db.session.commit()
        return {"message": "Password changed successfully."}

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _generate_tokens(user: User, ip: str = None, ua: str = None) -> dict:
        """Generate JWT access + refresh tokens and persist refresh token."""
        access_token = create_access_token(
            identity=user.id,
            additional_claims={"role": user.role, "email": user.email},
        )
        refresh_token = create_refresh_token(identity=user.id)
        decoded = decode_token(refresh_token)

        expires = datetime.now(timezone.utc) + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
        rt = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            jti=decoded["jti"],
            expires_at=expires,
            ip_address=ip,
            user_agent=ua,
        )
        db.session.add(rt)
        db.session.commit()

        return {"access_token": access_token, "refresh_token": refresh_token}

    @staticmethod
    def _create_otp(user: User, purpose: str) -> OTP:
        """Generate 6-digit OTP, persist, and schedule delivery."""
        code = "".join(random.choices(string.digits, k=6))
        expires = datetime.now(timezone.utc) + timedelta(minutes=5)

        otp = OTP(
            id=str(uuid.uuid4()),
            user_id=user.id,
            code=code,
            purpose=purpose,
            expires_at=expires,
        )
        db.session.add(otp)
        db.session.commit()
        # TODO: trigger Celery task to deliver via Twilio/FCM
        return otp

    @staticmethod
    def _serialize_user(user: User) -> dict:
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "status": user.status,
            "profile_photo": user.profile_photo,
            "is_phone_verified": user.is_phone_verified,
            "is_email_verified": user.is_email_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
