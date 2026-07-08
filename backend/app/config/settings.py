"""
MotoEase - Application Configuration

Manages environment-based configuration with sensible defaults.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    """Base configuration shared by all environments."""

    # ── App ──────────────────────────────────────────────────────────
    APP_NAME = os.getenv("APP_NAME", "EASY RIDE")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    BASE_URL = os.getenv("BASE_URL", "http://localhost:5000")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # ── Database ─────────────────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://postgres:password@localhost:5432/motoease_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20,
    }

    # ── JWT ──────────────────────────────────────────────────────────
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 2592000))
    )
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]

    # ── Redis / Celery ───────────────────────────────────────────────
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND = os.getenv(
        "CELERY_RESULT_BACKEND", "redis://localhost:6379/2"
    )
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TIMEZONE = "Asia/Kolkata"

    # ── Mail ─────────────────────────────────────────────────────────
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv(
        "MAIL_DEFAULT_SENDER", "EASY RIDE <noreply@easyride.com>"
    )

    # ── Twilio ───────────────────────────────────────────────────────
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

    # ── Firebase ─────────────────────────────────────────────────────
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

    # ── Cloudinary ───────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # ── AWS S3 ───────────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "motoease-uploads")
    AWS_S3_REGION = os.getenv("AWS_S3_REGION", "ap-south-1")

    # ── Razorpay ─────────────────────────────────────────────────────
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

    # ── Google Maps ──────────────────────────────────────────────────
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

    # ── Rate Limiting ────────────────────────────────────────────────
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "200 per day;50 per hour")
    RATELIMIT_STORAGE_URL = os.getenv(
        "RATELIMIT_STORAGE_URL", "redis://localhost:6379/3"
    )

    # ── CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")

    # ── File Upload ──────────────────────────────────────────────────
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "pdf"}

    # ── Cache ────────────────────────────────────────────────────────
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_DEFAULT_TIMEOUT = 300


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""

    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = False  # Set True to log SQL queries


class TestingConfig(BaseConfig):
    """Testing environment configuration."""

    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_TEST_URL",
        "postgresql://postgres:password@localhost:5432/motoease_test_db",
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    WTF_CSRF_ENABLED = False


class ProductionConfig(BaseConfig):
    """Production environment configuration."""

    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False


# ── Configuration Registry ───────────────────────────────────────────
config_map = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config() -> BaseConfig:
    """Returns the appropriate configuration class based on FLASK_ENV."""
    env = os.getenv("FLASK_ENV", "development")
    return config_map.get(env, DevelopmentConfig)
