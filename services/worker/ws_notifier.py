import redis
import json
import os
from services.api.logging_config import logger

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

def get_redis_client():
    return redis.from_url(REDIS_URL)

def send_ws_notification(user_id: int, message: dict):
    try:
        r = get_redis_client()
        channel = f"ws_user_{user_id}"
        payload = json.dumps(message)
        r.publish(channel, payload)
        logger.info("redis_notification_published", user_id=user_id, channel=channel)
    except Exception as e:
        logger.warning("redis_notification_failed", user_id=user_id, error=str(e))