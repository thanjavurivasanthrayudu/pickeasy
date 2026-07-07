"""
MotoEase - Service Models

Covers: Service categories, packages, checklist templates.
"""
import enum

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin


class ServiceCategory(AuditMixin, db.Model):
    """Top-level service categories (e.g. Basic Service, Full Service)."""

    __tablename__ = "service_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    packages = relationship("ServicePackage", back_populates="category")


class ServicePackage(AuditMixin, db.Model):
    """Service packages with pricing and duration."""

    __tablename__ = "service_packages"

    category_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("service_categories.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    discounted_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    includes: Mapped[list | None] = mapped_column(JSON, nullable=True)   # list of included items
    excludes: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    category = relationship("ServiceCategory", back_populates="packages")
    checklist_templates = relationship("ChecklistTemplate", back_populates="package")
    bookings = relationship("Booking", back_populates="service_package")


class ChecklistTemplate(AuditMixin, db.Model):
    """Inspection checklist templates tied to a service package."""

    __tablename__ = "checklist_templates"

    package_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("service_packages.id"), nullable=False, index=True
    )
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    package = relationship("ServicePackage", back_populates="checklist_templates")
