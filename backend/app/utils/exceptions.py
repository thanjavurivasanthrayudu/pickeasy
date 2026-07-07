"""
MotoEase - Custom Exceptions
"""


class MotoEaseBaseError(Exception):
    """Base exception for all MotoEase errors."""
    status_code = 500
    code = "INTERNAL_ERROR"

    def __init__(self, message: str = "An unexpected error occurred."):
        self.message = message
        super().__init__(message)

    def to_dict(self):
        return {"error": self.__class__.__name__, "message": self.message, "code": self.code}


class ValidationError(MotoEaseBaseError):
    status_code = 422
    code = "VALIDATION_ERROR"


class AuthError(MotoEaseBaseError):
    status_code = 401
    code = "AUTH_ERROR"


class ForbiddenError(MotoEaseBaseError):
    status_code = 403
    code = "FORBIDDEN"


class NotFoundError(MotoEaseBaseError):
    status_code = 404
    code = "NOT_FOUND"


class ConflictError(MotoEaseBaseError):
    status_code = 409
    code = "CONFLICT"


class PaymentError(MotoEaseBaseError):
    status_code = 402
    code = "PAYMENT_ERROR"


class ServiceUnavailableError(MotoEaseBaseError):
    status_code = 503
    code = "SERVICE_UNAVAILABLE"
