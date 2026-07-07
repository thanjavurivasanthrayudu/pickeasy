"""
MotoEase - Customer and Vehicle Models
"""
import enum

from sqlalchemy import (Boolean, Enum, Float, ForeignKey, Integer, String, Text)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin


class Customer(AuditMixin, db.Model):
    """Customer profile extending the base User."""

    __tablename__ = "customers"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    referral_code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    referred_by: Mapped[str | None] = mapped_column(String(20), nullable=True)
    wallet_balance: Mapped[float] = mapped_column(Float, default=0.0)
    total_bookings: Mapped[int] = mapped_column(Integer, default=0)
    total_spent: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    user = relationship("User", back_populates="customer_profile")
    vehicles = relationship("Vehicle", back_populates="customer", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")


# ── Vehicle ───────────────────────────────────────────────────────────────────

class FuelType(str, enum.Enum):
    PETROL = "petrol"
    ELECTRIC = "electric"
    CNG = "cng"


class VehicleBrand(AuditMixin, db.Model):
    __tablename__ = "vehicle_brands"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    models = relationship("VehicleModel", back_populates="brand")


class VehicleModel(AuditMixin, db.Model):
    __tablename__ = "vehicle_models"

    brand_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("vehicle_brands.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    brand = relationship("VehicleBrand", back_populates="models")
    vehicles = relationship("Vehicle", back_populates="model")


class Vehicle(AuditMixin, db.Model):
    """Customer vehicle (bike) details."""

    __tablename__ = "vehicles"

    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    brand_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("vehicle_brands.id"), nullable=False
    )
    model_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("vehicle_models.id"), nullable=False
    )
    registration_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    fuel_type: Mapped[str] = mapped_column(Enum(FuelType, name="fuel_type_enum"), nullable=False)
    mileage: Mapped[float | None] = mapped_column(Float, nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="vehicles")
    brand = relationship("VehicleBrand")
    model = relationship("VehicleModel", back_populates="vehicles")
    bookings = relationship("Booking", back_populates="vehicle")
