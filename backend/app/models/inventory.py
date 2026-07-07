"""
MotoEase - Inventory, Audit Log, Report, Support, and Leaderboard Models
"""
import enum
from datetime import datetime

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, JSON, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db
from app.models.base import AuditMixin, UUIDMixin, utcnow


# ── Inventory ─────────────────────────────────────────────────────────────────

class InventoryItem(AuditMixin, db.Model):
    __tablename__ = "inventory_items"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="piece")
    purchase_price: Mapped[float] = mapped_column(Float, nullable=False)
    selling_price: Mapped[float] = mapped_column(Float, nullable=False)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, default=5)
    vendor_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    transactions = relationship("InventoryTransaction", back_populates="item")


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"
    USED = "used"
    ADJUSTMENT = "adjustment"
    RETURN = "return"


class InventoryTransaction(AuditMixin, db.Model):
    __tablename__ = "inventory_transactions"

    item_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("inventory_items.id"), nullable=False, index=True)
    transaction_type: Mapped[str] = mapped_column(Enum(TransactionType, name="inv_txn_type_enum"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    reference_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)

    item = relationship("InventoryItem", back_populates="transactions")


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLog(UUIDMixin, db.Model):
    __tablename__ = "audit_logs"

    user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(60), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    old_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at = mapped_column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="audit_logs")


# ── Support / Complaints ──────────────────────────────────────────────────────

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SupportTicket(AuditMixin, db.Model):
    __tablename__ = "support_tickets"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    booking_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("bookings.id"), nullable=True)
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Enum(TicketStatus, name="ticket_status_enum"), nullable=False, default=TicketStatus.OPEN)
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    assigned_to: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachments: Mapped[list | None] = mapped_column(JSON, nullable=True)

    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")


class SupportMessage(UUIDMixin, db.Model):
    __tablename__ = "support_messages"

    ticket_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at = mapped_column(DateTime(timezone=True), default=utcnow)

    ticket = relationship("SupportTicket", back_populates="messages")


# ── Leaderboard ───────────────────────────────────────────────────────────────

class LeaderboardEntry(AuditMixin, db.Model):
    __tablename__ = "leaderboard"

    mechanic_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("mechanics.id"), nullable=False, index=True)
    period_type: Mapped[str] = mapped_column(String(20), nullable=False)   # daily/weekly/monthly/yearly
    period_label: Mapped[str] = mapped_column(String(30), nullable=False)  # '2024-W01', '2024-01', '2024'
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0)
    completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    total_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    badges: Mapped[list | None] = mapped_column(JSON, nullable=True)


# ── Placeholder imports for models in separate files ──────────────────────────
# These ensure SQLAlchemy metadata is complete. Individual model files import `db` from `app`.
