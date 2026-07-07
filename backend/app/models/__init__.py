# Stub — imports all models so SQLAlchemy metadata is fully populated.
from app.models.user import User, RefreshToken, OTP, UserSession  # noqa
from app.models.vehicle import Customer, Vehicle, VehicleBrand, VehicleModel  # noqa
from app.models.mechanic import Mechanic, MechanicDocument, MechanicAvailability, MechanicLocationHistory  # noqa
from app.models.service import ServiceCategory, ServicePackage, ChecklistTemplate  # noqa
from app.models.booking import Booking, BookingStatusHistory, BookingMechanicNotification  # noqa
from app.models.inspection import Inspection, ChecklistItem, InspectionSparePart  # noqa
from app.models.payment import Payment, Invoice, InvoiceItem, Coupon, CouponUsage  # noqa
from app.models.review import Review  # noqa  (see below)
from app.models.notification import Notification, NotificationTemplate  # noqa
from app.models.inventory import InventoryItem, InventoryTransaction, AuditLog, SupportTicket, SupportMessage, LeaderboardEntry  # noqa
