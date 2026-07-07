"""
MotoEase - Payment, Invoice, and Coupon Models
"""
import enum

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, JSON, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin, UUIDMixin, utcnow


# ── Payment ───────────────────────────────────────────────────────────────────

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    INITIATED = "initiated"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentMethod(str, enum.Enum):
    RAZORPAY = "razorpay"
    UPI = "upi"
    CASH = "cash"
    WALLET = "wallet"
    CARD = "card"


class Payment(AuditMixin, db.Model):
    """Payment transaction record."""

    __tablename__ = "payments"

    booking_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    customer_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"), nullable=False)

    razorpay_order_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    razorpay_signature: Mapped[str | None] = mapped_column(String(500), nullable=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(5), default="INR")
    method: Mapped[str] = mapped_column(Enum(PaymentMethod, name="payment_method_enum"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(PaymentStatus, name="payment_status_enum"),
        nullable=False, default=PaymentStatus.PENDING
    )
    refund_amount: Mapped[float] = mapped_column(Float, default=0.0)
    refund_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    booking = relationship("Booking", back_populates="payment")


# ── Invoice ───────────────────────────────────────────────────────────────────

class Invoice(AuditMixin, db.Model):
    """Invoice issued after service completion."""

    __tablename__ = "invoices"

    booking_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("bookings.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    invoice_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"), nullable=False)
    mechanic_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("mechanics.id"), nullable=False)

    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    tax: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    issued_at = mapped_column(DateTime(timezone=True), default=utcnow)

    booking = relationship("Booking", back_populates="invoice")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(UUIDMixin, db.Model):
    """Line items in an invoice."""

    __tablename__ = "invoice_items"

    invoice_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    item_type: Mapped[str] = mapped_column(String(30), default="service")  # service / part

    invoice = relationship("Invoice", back_populates="items")


# ── Coupon ────────────────────────────────────────────────────────────────────

class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"


class Coupon(AuditMixin, db.Model):
    """Discount coupons managed by admin."""

    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    discount_type: Mapped[str] = mapped_column(Enum(DiscountType, name="discount_type_enum"), nullable=False)
    discount_value: Mapped[float] = mapped_column(Float, nullable=False)
    max_discount: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_booking_amount: Mapped[float] = mapped_column(Float, default=0.0)
    usage_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    per_user_limit: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until = mapped_column(DateTime(timezone=True), nullable=False)
    applicable_services: Mapped[list | None] = mapped_column(JSON, nullable=True)

    bookings = relationship("Booking", back_populates="coupon")
    usages = relationship("CouponUsage", back_populates="coupon")


class CouponUsage(UUIDMixin, db.Model):
    __tablename__ = "coupon_usages"

    coupon_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("coupons.id"), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"), nullable=False)
    booking_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("bookings.id"), nullable=False)
    discount_applied: Mapped[float] = mapped_column(Float, nullable=False)
    used_at = mapped_column(DateTime(timezone=True), default=utcnow)

    coupon = relationship("Coupon", back_populates="usages")
