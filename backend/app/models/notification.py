"""
MotoEase - Review, Rating, and Notification Models
"""
import enum

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, JSON, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin, UUIDMixin, utcnow


# ── Review ────────────────────────────────────────────────────────────────────

class Review(AuditMixin, db.Model):
    """Customer review for a completed booking."""

    __tablename__ = "reviews"

    booking_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    customer_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"), nullable=False, index=True)
    mechanic_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("mechanics.id"), nullable=False, index=True)

    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False)   # 1-5
    punctuality_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quality_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    behavior_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cleanliness_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)

    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    photos: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    admin_reply: Mapped[str | None] = mapped_column(Text, nullable=True)

    booking = relationship("Booking", back_populates="review")
    customer = relationship("Customer", back_populates="reviews")
    mechanic = relationship("Mechanic", back_populates="reviews")


# ── Notification ──────────────────────────────────────────────────────────────

class NotificationType(str, enum.Enum):
    BOOKING_CONFIRMED = "booking_confirmed"
    MECHANIC_ASSIGNED = "mechanic_assigned"
    MECHANIC_ARRIVING = "mechanic_arriving"
    SERVICE_STARTED = "service_started"
    APPROVAL_REQUIRED = "approval_required"
    SERVICE_COMPLETED = "service_completed"
    INVOICE_READY = "invoice_ready"
    REVIEW_REMINDER = "review_reminder"
    NEW_BOOKING = "new_booking"
    BOOKING_CANCELLED = "booking_cancelled"
    PAYMENT_CREDITED = "payment_credited"
    REVIEW_RECEIVED = "review_received"
    INVENTORY_ALERT = "inventory_alert"
    GENERAL = "general"


class NotificationChannel(str, enum.Enum):
    PUSH = "push"
    SMS = "sms"
    EMAIL = "email"
    IN_APP = "in_app"


class Notification(AuditMixin, db.Model):
    """In-app / push notification record."""

    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(
        Enum(NotificationType, name="notification_type_enum"), nullable=False
    )
    channel: Mapped[str] = mapped_column(
        Enum(NotificationChannel, name="notification_channel_enum"),
        nullable=False, default=NotificationChannel.IN_APP
    )
    reference_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)   # 'booking', 'payment', etc.
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at = mapped_column(DateTime(timezone=True), nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user = relationship("User", back_populates="notifications")


class NotificationTemplate(AuditMixin, db.Model):
    """Templated messages for each notification type."""

    __tablename__ = "notification_templates"

    notification_type: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    title_template: Mapped[str] = mapped_column(String(300), nullable=False)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)
    sms_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_subject: Mapped[str | None] = mapped_column(String(300), nullable=True)
    email_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
