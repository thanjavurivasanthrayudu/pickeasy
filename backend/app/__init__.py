"""
MotoEase - Flask Application Factory

Bootstraps the Flask app with all extensions, blueprints, and configuration.
"""
import os

from flask import Flask, jsonify
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

from app.config.settings import get_config

# ── Extension Instances ─────────────────────────────────────────────
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
mail = Mail()
cache = Cache()
socketio = SocketIO()
limiter = Limiter(key_func=get_remote_address)


def create_app(config_class=None) -> Flask:
    """Application factory — creates and configures the Flask application."""

    app = Flask(__name__, instance_relative_config=True)

    # ── Configuration ─────────────────────────────────────────────
    cfg = config_class or get_config()
    app.config.from_object(cfg)

    # ── Initialize Extensions ─────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    cache.init_app(app)
    limiter.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    socketio.init_app(
        app,
        cors_allowed_origins=app.config["CORS_ORIGINS"],
        async_mode="eventlet",
        message_queue=app.config["REDIS_URL"],
    )

    # ── Import Models (ensures they register with SQLAlchemy) ─────
    with app.app_context():
        from app.models import (  # noqa: F401
            audit,
            booking,
            coupon,
            inspection,
            inventory,
            mechanic,
            notification,
            otp,
            payment,
            report,
            review,
            service,
            support,
            user,
            vehicle,
        )

    # ── Register API Blueprints ───────────────────────────────────
    _register_blueprints(app)

    # ── JWT Callbacks ─────────────────────────────────────────────
    _configure_jwt(app)

    # ── Health Check ──────────────────────────────────────────────
    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "app": "MotoEase"}), 200

    # ── Error Handlers ────────────────────────────────────────────
    _register_error_handlers(app)

    return app


def _register_blueprints(app: Flask) -> None:
    """Register all API blueprints under /api/v1."""
    from app.api.v1.routes.auth import auth_bp
    from app.api.v1.routes.admin import admin_bp
    from app.api.v1.routes.booking import booking_bp
    from app.api.v1.routes.coupon import coupon_bp
    from app.api.v1.routes.customer import customer_bp
    from app.api.v1.routes.inspection import inspection_bp
    from app.api.v1.routes.inventory import inventory_bp
    from app.api.v1.routes.mechanic import mechanic_bp
    from app.api.v1.routes.notification import notification_bp
    from app.api.v1.routes.payment import payment_bp
    from app.api.v1.routes.report import report_bp
    from app.api.v1.routes.review import review_bp
    from app.api.v1.routes.service import service_bp
    from app.api.v1.routes.support import support_bp
    from app.api.v1.routes.vehicle import vehicle_bp

    prefix = "/api/v1"
    app.register_blueprint(auth_bp, url_prefix=f"{prefix}/auth")
    app.register_blueprint(customer_bp, url_prefix=f"{prefix}/customers")
    app.register_blueprint(mechanic_bp, url_prefix=f"{prefix}/mechanics")
    app.register_blueprint(admin_bp, url_prefix=f"{prefix}/admin")
    app.register_blueprint(booking_bp, url_prefix=f"{prefix}/bookings")
    app.register_blueprint(service_bp, url_prefix=f"{prefix}/services")
    app.register_blueprint(vehicle_bp, url_prefix=f"{prefix}/vehicles")
    app.register_blueprint(payment_bp, url_prefix=f"{prefix}/payments")
    app.register_blueprint(review_bp, url_prefix=f"{prefix}/reviews")
    app.register_blueprint(notification_bp, url_prefix=f"{prefix}/notifications")
    app.register_blueprint(inventory_bp, url_prefix=f"{prefix}/inventory")
    app.register_blueprint(report_bp, url_prefix=f"{prefix}/reports")
    app.register_blueprint(coupon_bp, url_prefix=f"{prefix}/coupons")
    app.register_blueprint(inspection_bp, url_prefix=f"{prefix}/inspections")
    app.register_blueprint(support_bp, url_prefix=f"{prefix}/support")


def _configure_jwt(app: Flask) -> None:
    """Configure JWT token callbacks."""
    from app.models.user import RefreshToken

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = db.session.query(RefreshToken).filter_by(jti=jti, revoked=True).first()
        return token is not None

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired", "code": "TOKEN_EXPIRED"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid token", "code": "INVALID_TOKEN"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return (
            jsonify({"error": "Authorization token required", "code": "AUTH_REQUIRED"}),
            401,
        )


def _register_error_handlers(app: Flask) -> None:
    """Register global error handlers."""

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e)}), 400

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "message": str(e)}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": str(e)}), 404

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({"error": "Unprocessable Entity", "message": str(e)}), 422

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return (
            jsonify(
                {"error": "Rate limit exceeded", "message": "Too many requests", "code": "RATE_LIMITED"}
            ),
            429,
        )

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500
