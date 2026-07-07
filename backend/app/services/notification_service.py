"""MotoEase - Notification Service (stub — extended via Celery/Firebase in production)"""
import uuid
from app import db
from app.models.notification import Notification, NotificationChannel, NotificationType


class NotificationService:

    @staticmethod
    def send(user_id: str, title: str, body: str, ntype: str,
             channel: str = NotificationChannel.IN_APP,
             reference_id: str = None, reference_type: str = None,
             metadata: dict = None) -> Notification:
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title,
            body=body,
            notification_type=ntype,
            channel=channel,
            reference_id=reference_id,
            reference_type=reference_type,
            metadata=metadata,
        )
        db.session.add(notif)
        db.session.commit()
        # TODO: Push via Firebase FCM / Twilio SMS / SMTP
        return notif

    @staticmethod
    def mark_read(notification_id: str, user_id: str) -> bool:
        from datetime import datetime, timezone
        notif = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if notif:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            db.session.commit()
            return True
        return False

    @staticmethod
    def get_unread_count(user_id: str) -> int:
        return Notification.query.filter_by(user_id=user_id, is_read=False).count()
