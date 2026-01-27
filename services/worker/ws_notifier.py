import redis
import json
import os
from services.common.config import settings
from services.common.logging_config import logger


def get_redis_client():
    return redis.from_url(settings.redis_url)

def send_ws_notification(user_id: int, message: dict):
    try:
        r = get_redis_client()
        channel = f"ws_user_{user_id}"
        payload = json.dumps(message)
        r.publish(channel, payload)
        logger.info("redis_notification_published", user_id=user_id, channel=channel)
    except Exception as e:
        logger.warning("redis_notification_failed", user_id=user_id, error=str(e))