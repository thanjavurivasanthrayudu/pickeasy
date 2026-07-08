"""
MotoEase - API Decorators / Middleware Helpers
"""
from functools import wraps

from flask import jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request

from app.utils.exceptions import AuthError, ForbiddenError


def jwt_required_with_role(*allowed_roles):
    """
    Decorator that enforces JWT authentication and role-based access.

    Usage:
        @jwt_required_with_role("admin", "mechanic")
        def my_view():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                resp = AuthError(str(e))
                return jsonify(resp.to_dict()), resp.status_code

            claims = get_jwt()
            user_role = claims.get("role")

            if allowed_roles and user_role not in allowed_roles:
                err = ForbiddenError(
                    f"Access denied. Required roles: {', '.join(allowed_roles)}."
                )
                return jsonify(err.to_dict()), err.status_code

            return fn(*args, **kwargs)

        return wrapper
    return decorator


def handle_errors(fn):
    """
    Decorator that catches EasyRideBaseError and returns structured JSON.
    """
    from app.utils.exceptions import EasyRideBaseError

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except EasyRideBaseError as e:
            return jsonify(e.to_dict()), e.status_code
        except Exception as e:
            return jsonify({"error": "InternalError", "message": str(e), "code": "INTERNAL_ERROR"}), 500

    return wrapper


def paginate_query(query, page: int = 1, per_page: int = 20):
    """
    Paginate a SQLAlchemy query and return a dict with items + meta.
    """
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": pagination.items,
        "meta": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        },
    }


def get_pagination_params(request) -> tuple[int, int]:
    """Extract page and per_page from query params with safe defaults."""
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    except (TypeError, ValueError):
        page, per_page = 1, 20
    return page, per_page
