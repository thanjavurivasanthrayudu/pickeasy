"""
EASY RIDE - Custom Exceptions
"""


class EasyRideBaseError(Exception):
    """Base exception for all EASY RIDE errors."""
    status_code = 500
    code = "INTERNAL_ERROR"

    def __init__(self, message: str = "An unexpected error occurred."):
        self.message = message
        super().__init__(message)

    def to_dict(self):
        return {"error": self.__class__.__name__, "message": self.message, "code": self.code}


class ValidationError(EasyRideBaseError):
    status_code = 422
    code = "VALIDATION_ERROR"


class AuthError(EasyRideBaseError):
    status_code = 401
    code = "AUTH_ERROR"


class ForbiddenError(EasyRideBaseError):
    status_code = 403
    code = "FORBIDDEN"


class NotFoundError(EasyRideBaseError):
    status_code = 404
    code = "NOT_FOUND"


class ConflictError(EasyRideBaseError):
    status_code = 409
    code = "CONFLICT"


class PaymentError(EasyRideBaseError):
    status_code = 402
    code = "PAYMENT_ERROR"


class ServiceUnavailableError(EasyRideBaseError):
    status_code = 503
    code = "SERVICE_UNAVAILABLE"
