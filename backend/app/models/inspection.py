"""
MotoEase - Inspection, Checklist, and Spare Parts Models
"""
import enum

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin, UUIDMixin


class InspectionStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"   # Customer approved extra parts


class Inspection(AuditMixin, db.Model):
    """Mechanic inspection record for a booking."""

    __tablename__ = "inspections"

    booking_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    mechanic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("mechanics.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum(InspectionStatus, name="inspection_status_enum"),
        nullable=False, default=InspectionStatus.PENDING
    )

    # Inspection readings
    mileage: Mapped[float | None] = mapped_column(Float, nullable=True)
    battery_level: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Good/Fair/Poor
    brake_condition: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tyre_condition: Mapped[str | None] = mapped_column(String(20), nullable=True)
    engine_condition: Mapped[str | None] = mapped_column(String(20), nullable=True)
    chain_condition: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Media
    before_photos: Mapped[list | None] = mapped_column(JSON, nullable=True)
    after_photos: Mapped[list | None] = mapped_column(JSON, nullable=True)
    mechanic_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Signature
    customer_signature_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    mechanic_signature_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Extra cost approval
    extra_parts_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    extra_cost: Mapped[float] = mapped_column(Float, default=0.0)
    customer_approved_extra: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    approval_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    booking = relationship("Booking", back_populates="inspection")
    checklist_items = relationship("ChecklistItem", back_populates="inspection", cascade="all, delete-orphan")
    spare_parts = relationship("InspectionSparePart", back_populates="inspection", cascade="all, delete-orphan")


class ChecklistItem(UUIDMixin, db.Model):
    """Individual checklist item filled during inspection."""

    __tablename__ = "checklist_items"

    inspection_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("inspections.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    template_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=True)   # ok/needs_attention/replaced
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    inspection = relationship("Inspection", back_populates="checklist_items")


class InspectionSparePart(UUIDMixin, db.Model):
    """Spare parts used or requested during a service."""

    __tablename__ = "inspection_spare_parts"

    inspection_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("inspections.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    inventory_item_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    part_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    is_approved: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    inspection = relationship("Inspection", back_populates="spare_parts")
