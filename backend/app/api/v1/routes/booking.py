"""MotoEase - Booking Routes"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.middleware.auth_middleware import handle_errors, get_pagination_params, paginate_query, jwt_required_with_role
from app.services.booking_service import BookingService
from app.utils.exceptions import ValidationError

booking_bp = Blueprint("booking", __name__)


@booking_bp.post("/")
@jwt_required_with_role("customer")
@handle_errors
def create_booking():
    data = request.get_json(force=True) or {}
    required = ["vehicle_id", "service_package_id", "scheduled_date", "scheduled_time",
                "service_address", "service_latitude", "service_longitude"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        raise ValidationError(f"Missing: {', '.join(missing)}")

    customer_id = get_jwt_identity()
    result = BookingService.create_booking(customer_id, data)
    return jsonify({"success": True, "data": result}), 201


@booking_bp.get("/")
@jwt_required()
@handle_errors
def list_bookings():
    identity = get_jwt_identity()
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    role = claims.get("role")
    page, per_page = get_pagination_params(request)
    status_filter = request.args.get("status")
    result = BookingService.list_bookings(identity, role, page, per_page, status_filter)
    return jsonify({"success": True, **result}), 200


@booking_bp.get("/<string:booking_id>")
@jwt_required()
@handle_errors
def get_booking(booking_id):
    identity = get_jwt_identity()
    result = BookingService.get_booking(booking_id, identity)
    return jsonify({"success": True, "data": result}), 200


@booking_bp.put("/<string:booking_id>/cancel")
@jwt_required()
@handle_errors
def cancel_booking(booking_id):
    identity = get_jwt_identity()
    data = request.get_json(force=True) or {}
    result = BookingService.cancel_booking(booking_id, identity, data.get("reason"))
    return jsonify({"success": True, "data": result}), 200


@booking_bp.put("/<string:booking_id>/accept")
@jwt_required_with_role("mechanic")
@handle_errors
def accept_booking(booking_id):
    mechanic_id = get_jwt_identity()
    result = BookingService.accept_booking(booking_id, mechanic_id)
    return jsonify({"success": True, "data": result}), 200


@booking_bp.put("/<string:booking_id>/reject")
@jwt_required_with_role("mechanic")
@handle_errors
def reject_booking(booking_id):
    mechanic_id = get_jwt_identity()
    data = request.get_json(force=True) or {}
    result = BookingService.reject_booking(booking_id, mechanic_id, data.get("reason"))
    return jsonify({"success": True, "data": result}), 200


@booking_bp.put("/<string:booking_id>/status")
@jwt_required_with_role("mechanic", "admin")
@handle_errors
def update_status(booking_id):
    identity = get_jwt_identity()
    data = request.get_json(force=True) or {}
    if not data.get("status"):
        raise ValidationError("Status is required.")
    result = BookingService.update_status(booking_id, data["status"], identity, data.get("note"))
    return jsonify({"success": True, "data": result}), 200


@booking_bp.get("/<string:booking_id>/track")
@jwt_required()
@handle_errors
def track_mechanic(booking_id):
    result = BookingService.get_tracking_info(booking_id)
    return jsonify({"success": True, "data": result}), 200
