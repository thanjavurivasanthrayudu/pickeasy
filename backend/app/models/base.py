"""
MotoEase - Base Model

Provides a SQLAlchemy declarative base with shared audit fields: 
created_at, updated_at, soft-delete support, and UUID primary keys.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    """Mixin that adds created_at / updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class SoftDeleteMixin:
    """Mixin that adds soft-delete support."""

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = utcnow()


class UUIDMixin:
    """Mixin that adds a UUID primary key."""

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )


class AuditMixin(UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Convenience mixin combining UUID, Timestamp, and SoftDelete."""

    def to_dict(self, exclude: list[str] | None = None) -> dict:
        """Serialize model to dict, excluding sensitive / internal fields."""
        exclude = exclude or []
        result = {}
        for col in self.__table__.columns:
            if col.name not in exclude:
                val = getattr(self, col.name)
                if isinstance(val, datetime):
                    val = val.isoformat()
                elif isinstance(val, uuid.UUID):
                    val = str(val)
                result[col.name] = val
        return result
