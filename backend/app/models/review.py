"""
MotoEase - Review Model (standalone to avoid circular imports)
"""
from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin


class Review(AuditMixin, db.Model):
    __tablename__ = "reviews"

    booking_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"), nullable=False, index=True)
    mechanic_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("mechanics.id"), nullable=False, index=True)
    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False)
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
