"""MotoEase - Booking Service"""
import uuid
from datetime import date, datetime, timezone

from app import db
from app.models.booking import (Booking, BookingMechanicNotification,
                                  BookingStatus, BookingStatusHistory,
                                  MechanicNotificationStatus)
from app.utils.exceptions import (ForbiddenError, NotFoundError, ValidationError)


class BookingService:

    @staticmethod
    def create_booking(customer_id: str, data: dict) -> dict:
        from app.models.vehicle import Customer

        customer = db.session.query(Customer).filter_by(user_id=customer_id).first()
        if not customer:
            raise NotFoundError("Customer profile not found.")

        booking_number = f"ME{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        booking = Booking(
            id=str(uuid.uuid4()),
            booking_number=booking_number,
            customer_id=customer.id,
            vehicle_id=data["vehicle_id"],
            service_package_id=data["service_package_id"],
            coupon_id=data.get("coupon_id"),
            status=BookingStatus.PENDING,
            scheduled_date=data["scheduled_date"],
            scheduled_time=data["scheduled_time"],
            service_latitude=float(data["service_latitude"]),
            service_longitude=float(data["service_longitude"]),
            service_address=data["service_address"],
            landmark=data.get("landmark"),
            customer_photos=data.get("photos", []),
            customer_notes=data.get("notes"),
            base_amount=data.get("base_amount", 0),
            total_amount=data.get("total_amount", 0),
        )
        db.session.add(booking)

        history = BookingStatusHistory(
            id=str(uuid.uuid4()),
            booking_id=booking.id,
            status=BookingStatus.PENDING,
            note="Booking created.",
        )
        db.session.add(history)
        db.session.commit()

        # TODO: trigger Celery task to find and notify eligible mechanics
        return BookingService._serialize(booking)

    @staticmethod
    def list_bookings(user_id: str, role: str, page: int, per_page: int, status_filter: str = None) -> dict:
        from app.models.vehicle import Customer
        from app.models.mechanic import Mechanic

        q = Booking.query.filter_by(is_deleted=False)

        if role == "customer":
            customer = db.session.query(Customer).filter_by(user_id=user_id).first()
            if customer:
                q = q.filter_by(customer_id=customer.id)
        elif role == "mechanic":
            mechanic = db.session.query(Mechanic).filter_by(user_id=user_id).first()
            if mechanic:
                q = q.filter_by(mechanic_id=mechanic.id)

        if status_filter:
            q = q.filter_by(status=status_filter)

        q = q.order_by(Booking.created_at.desc())
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": [BookingService._serialize(b) for b in pagination.items],
            "meta": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total": pagination.total,
                "pages": pagination.pages,
            },
        }

    @staticmethod
    def get_booking(booking_id: str, user_id: str) -> dict:
        booking = Booking.query.get(booking_id)
        if not booking or booking.is_deleted:
            raise NotFoundError("Booking not found.")
        return BookingService._serialize(booking)

    @staticmethod
    def cancel_booking(booking_id: str, user_id: str, reason: str = None) -> dict:
        booking = Booking.query.get(booking_id)
        if not booking:
            raise NotFoundError("Booking not found.")
        if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            raise ValidationError("Cannot cancel a completed or already cancelled booking.")

        booking.status = BookingStatus.CANCELLED
        booking.cancelled_at = datetime.now(timezone.utc)
        booking.cancellation_reason = reason
        booking.cancelled_by = user_id

        history = BookingStatusHistory(
            id=str(uuid.uuid4()),
            booking_id=booking.id,
            status=BookingStatus.CANCELLED,
            note=reason or "Cancelled.",
            changed_by=user_id,
        )
        db.session.add(history)
        db.session.commit()
        return BookingService._serialize(booking)

    @staticmethod
    def accept_booking(booking_id: str, mechanic_user_id: str) -> dict:
        from app.models.mechanic import Mechanic
        mechanic = db.session.query(Mechanic).filter_by(user_id=mechanic_user_id).first()
        if not mechanic:
            raise NotFoundError("Mechanic not found.")

        booking = Booking.query.get(booking_id)
        if not booking:
            raise NotFoundError("Booking not found.")
        if booking.status not in [BookingStatus.PENDING, BookingStatus.SEARCHING]:
            raise ValidationError("Booking is no longer available.")

        booking.mechanic_id = mechanic.id
        booking.status = BookingStatus.MECHANIC_ACCEPTED
        booking.mechanic_assigned_at = datetime.now(timezone.utc)

        notif = db.session.query(BookingMechanicNotification).filter_by(
            booking_id=booking_id, mechanic_id=mechanic.id
        ).first()
        if notif:
            notif.status = MechanicNotificationStatus.ACCEPTED
            notif.responded_at = datetime.now(timezone.utc)

        history = BookingStatusHistory(
            id=str(uuid.uuid4()),
            booking_id=booking.id,
            status=BookingStatus.MECHANIC_ACCEPTED,
            note="Mechanic accepted booking.",
            changed_by=mechanic_user_id,
        )
        db.session.add(history)
        db.session.commit()
        return BookingService._serialize(booking)

    @staticmethod
    def reject_booking(booking_id: str, mechanic_user_id: str, reason: str = None) -> dict:
        from app.models.mechanic import Mechanic
        mechanic = db.session.query(Mechanic).filter_by(user_id=mechanic_user_id).first()

        notif = db.session.query(BookingMechanicNotification).filter_by(
            booking_id=booking_id, mechanic_id=mechanic.id if mechanic else None
        ).first()
        if notif:
            notif.status = MechanicNotificationStatus.REJECTED
            notif.responded_at = datetime.now(timezone.utc)
            notif.rejection_reason = reason
            db.session.commit()

        return {"message": "Booking rejected."}

    @staticmethod
    def update_status(booking_id: str, new_status: str, user_id: str, note: str = None) -> dict:
        booking = Booking.query.get(booking_id)
        if not booking:
            raise NotFoundError("Booking not found.")

        booking.status = new_status
        if new_status == BookingStatus.SERVICE_IN_PROGRESS:
            booking.service_started_at = datetime.now(timezone.utc)
        elif new_status == BookingStatus.COMPLETED:
            booking.completed_at = datetime.now(timezone.utc)
        elif new_status == BookingStatus.ARRIVED:
            booking.mechanic_arrived_at = datetime.now(timezone.utc)

        history = BookingStatusHistory(
            id=str(uuid.uuid4()),
            booking_id=booking.id,
            status=new_status,
            note=note,
            changed_by=user_id,
        )
        db.session.add(history)
        db.session.commit()
        return BookingService._serialize(booking)

    @staticmethod
    def get_tracking_info(booking_id: str) -> dict:
        booking = Booking.query.get(booking_id)
        if not booking:
            raise NotFoundError("Booking not found.")

        tracking = {
            "status": booking.status,
            "mechanic_id": booking.mechanic_id,
            "mechanic_latitude": None,
            "mechanic_longitude": None,
            "estimated_arrival": None,
        }

        if booking.mechanic_id:
            from app.models.mechanic import Mechanic
            mechanic = db.session.get(Mechanic, booking.mechanic_id)
            if mechanic:
                tracking["mechanic_latitude"] = mechanic.current_latitude
                tracking["mechanic_longitude"] = mechanic.current_longitude

        return tracking

    @staticmethod
    def _serialize(booking: Booking) -> dict:
        return {
            "id": booking.id,
            "booking_number": booking.booking_number,
            "customer_id": booking.customer_id,
            "mechanic_id": booking.mechanic_id,
            "vehicle_id": booking.vehicle_id,
            "service_package_id": booking.service_package_id,
            "status": booking.status,
            "scheduled_date": str(booking.scheduled_date) if booking.scheduled_date else None,
            "scheduled_time": str(booking.scheduled_time) if booking.scheduled_time else None,
            "service_address": booking.service_address,
            "landmark": booking.landmark,
            "service_latitude": booking.service_latitude,
            "service_longitude": booking.service_longitude,
            "base_amount": booking.base_amount,
            "discount_amount": booking.discount_amount,
            "extra_parts_amount": booking.extra_parts_amount,
            "tax_amount": booking.tax_amount,
            "total_amount": booking.total_amount,
            "customer_notes": booking.customer_notes,
            "created_at": booking.created_at.isoformat() if booking.created_at else None,
            "completed_at": booking.completed_at.isoformat() if booking.completed_at else None,
        }
