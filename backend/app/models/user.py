"""
MotoEase - User, Role, and Authentication Models

Covers: users (all roles), refresh tokens, OTP, sessions, role-permissions.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin, TimestampMixin, UUIDMixin, utcnow

# ── Role Enum ────────────────────────────────────────────────────────────────
import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    MECHANIC = "mechanic"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


# ── User ─────────────────────────────────────────────────────────────────────

class User(AuditMixin, db.Model):
    """Central user table for all roles."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(UserRole, name="user_role_enum"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum(UserStatus, name="user_status_enum"), nullable=False, default=UserStatus.ACTIVE
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    profile_photo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fcm_token: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    customer_profile = relationship("Customer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mechanic_profile = relationship("Mechanic", back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    otps = relationship("OTP", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


# ── Refresh Token ─────────────────────────────────────────────────────────────

class RefreshToken(UUIDMixin, TimestampMixin, db.Model):
    """Tracks issued refresh tokens to allow revocation."""

    __tablename__ = "refresh_tokens"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    jti: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


# ── OTP ───────────────────────────────────────────────────────────────────────

class OTPPurpose(str, enum.Enum):
    PHONE_VERIFY = "phone_verify"
    EMAIL_VERIFY = "email_verify"
    FORGOT_PASSWORD = "forgot_password"
    LOGIN = "login"


class OTP(UUIDMixin, db.Model):
    """One-time passwords for phone / email verification."""

    __tablename__ = "otps"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    purpose: Mapped[str] = mapped_column(Enum(OTPPurpose, name="otp_purpose_enum"), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    attempts: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", back_populates="otps")


# ── Session ───────────────────────────────────────────────────────────────────

class UserSession(UUIDMixin, TimestampMixin, db.Model):
    """Tracks active user sessions for security monitoring."""

    __tablename__ = "user_sessions"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_activity: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
