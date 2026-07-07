"""
MotoEase - Booking Models

Full lifecycle: booking creation → mechanic assignment → tracking → completion.
"""
import enum

from sqlalchemy import (Boolean, DateTime, Enum, Float, ForeignKey,
                        Integer, JSON, String, Text)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin, UUIDMixin, utcnow


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    SEARCHING = "searching"          # Looking for mechanic
    MECHANIC_ASSIGNED = "mechanic_assigned"
    MECHANIC_ACCEPTED = "mechanic_accepted"
    MECHANIC_EN_ROUTE = "mechanic_en_route"
    ARRIVED = "arrived"
    INSPECTION = "inspection"
    SERVICE_IN_PROGRESS = "service_in_progress"
    AWAITING_APPROVAL = "awaiting_approval"   # Extra parts approval
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_MECHANIC_FOUND = "no_mechanic_found"


class Booking(AuditMixin, db.Model):
    """Core booking entity."""

    __tablename__ = "bookings"

    booking_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("customers.id"), nullable=False, index=True
    )
    mechanic_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("mechanics.id"), nullable=True, index=True
    )
    vehicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("vehicles.id"), nullable=False
    )
    service_package_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("service_packages.id"), nullable=False
    )
    coupon_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("coupons.id"), nullable=True
    )

    status: Mapped[str] = mapped_column(
        Enum(BookingStatus, name="booking_status_enum"),
        nullable=False, default=BookingStatus.PENDING
    )

    # Schedule
    scheduled_date = mapped_column(db.Date, nullable=False)
    scheduled_time = mapped_column(db.Time, nullable=False)

    # Location
    service_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    service_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    service_address: Mapped[str] = mapped_column(Text, nullable=False)
    landmark: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Photos
    customer_photos: Mapped[list | None] = mapped_column(JSON, nullable=True)   # list of URLs

    # Pricing
    base_amount: Mapped[float] = mapped_column(Float, default=0.0)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    extra_parts_amount: Mapped[float] = mapped_column(Float, default=0.0)
    tax_amount: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    platform_fee: Mapped[float] = mapped_column(Float, default=0.0)
    mechanic_earnings: Mapped[float] = mapped_column(Float, default=0.0)

    # Timestamps
    mechanic_assigned_at = mapped_column(DateTime(timezone=True), nullable=True)
    mechanic_arrived_at = mapped_column(DateTime(timezone=True), nullable=True)
    service_started_at = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelled_by: Mapped[str | None] = mapped_column(String(20), nullable=True)

    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="bookings")
    mechanic = relationship("Mechanic", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    service_package = relationship("ServicePackage", back_populates="bookings")
    coupon = relationship("Coupon", back_populates="bookings")
    status_history = relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan")
    mechanic_notifications = relationship("BookingMechanicNotification", back_populates="booking", cascade="all, delete-orphan")
    inspection = relationship("Inspection", back_populates="booking", uselist=False)
    payment = relationship("Payment", back_populates="booking", uselist=False)
    invoice = relationship("Invoice", back_populates="booking", uselist=False)
    review = relationship("Review", back_populates="booking", uselist=False)


class BookingStatusHistory(UUIDMixin, db.Model):
    """Immutable audit trail of every booking status change."""

    __tablename__ = "booking_status_history"

    booking_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    changed_at = mapped_column(DateTime(timezone=True), default=utcnow)

    booking = relationship("Booking", back_populates="status_history")


class MechanicNotificationStatus(str, enum.Enum):
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class BookingMechanicNotification(UUIDMixin, db.Model):
    """Tracks which mechanics were notified for a booking and their response."""

    __tablename__ = "booking_mechanic_notifications"

    booking_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    mechanic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("mechanics.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        Enum(MechanicNotificationStatus, name="mechanic_notif_status_enum"),
        default=MechanicNotificationStatus.SENT
    )
    sent_at = mapped_column(DateTime(timezone=True), default=utcnow)
    responded_at = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    booking = relationship("Booking", back_populates="mechanic_notifications")
