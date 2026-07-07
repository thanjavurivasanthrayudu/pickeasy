"""
MotoEase - Mechanic Models

Covers: Mechanic profile, availability, documents, location tracking.
"""
import enum

from sqlalchemy import (Boolean, Enum, Float, ForeignKey, Integer, JSON,
                        String, Text, Time)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin, TimestampMixin, UUIDMixin


class MechanicStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class Mechanic(AuditMixin, db.Model):
    """Mechanic profile extending base User."""

    __tablename__ = "mechanics"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        Enum(MechanicStatus, name="mechanic_status_enum"),
        nullable=False, default=MechanicStatus.PENDING
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    specializations: Mapped[list | None] = mapped_column(JSON, nullable=True)  # ['oil_change','brake_repair']
    languages: Mapped[list | None] = mapped_column(JSON, nullable=True)
    working_radius_km: Mapped[float] = mapped_column(Float, default=10.0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    total_jobs: Mapped[int] = mapped_column(Integer, default=0)
    completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0)
    pending_payout: Mapped[float] = mapped_column(Float, default=0.0)

    # Bank / payment details
    bank_account_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    bank_ifsc: Mapped[str | None] = mapped_column(String(15), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    upi_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Location
    current_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Relationships
    user = relationship("User", back_populates="mechanic_profile")
    documents = relationship("MechanicDocument", back_populates="mechanic", cascade="all, delete-orphan")
    availability = relationship("MechanicAvailability", back_populates="mechanic", cascade="all, delete-orphan")
    location_history = relationship("MechanicLocationHistory", back_populates="mechanic")
    bookings = relationship("Booking", back_populates="mechanic")
    reviews = relationship("Review", back_populates="mechanic")


class DocumentType(str, enum.Enum):
    AADHAR = "aadhar"
    PAN = "pan"
    DRIVING_LICENSE = "driving_license"
    POLICE_VERIFICATION = "police_verification"
    CERTIFICATION = "certification"
    PHOTO = "photo"


class MechanicDocument(AuditMixin, db.Model):
    """Documents uploaded by mechanics for admin verification."""

    __tablename__ = "mechanic_documents"

    mechanic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("mechanics.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    doc_type: Mapped[str] = mapped_column(
        Enum(DocumentType, name="doc_type_enum"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)

    mechanic = relationship("Mechanic", back_populates="documents")


class MechanicAvailability(UUIDMixin, db.Model):
    """Weekly schedule for mechanics."""

    __tablename__ = "mechanic_availability"

    mechanic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("mechanics.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time = mapped_column(Time, nullable=False)
    end_time = mapped_column(Time, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    mechanic = relationship("Mechanic", back_populates="availability")


class MechanicLocationHistory(UUIDMixin, db.Model):
    """Real-time location tracking for mechanics."""

    __tablename__ = "mechanic_location_history"

    mechanic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("mechanics.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    booking_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at = mapped_column(db.DateTime(timezone=True), default=lambda: __import__("datetime").datetime.utcnow())

    mechanic = relationship("Mechanic", back_populates="location_history")
