from fastapi import WebSocket
from typing import Dict, List
import redis
import asyncio
import json
import os
from services.common.config import settings
from services.common.logging_config import logger

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.redis_client = redis.from_url(REDIS_URL)
        self.pubsub = self.redis_client.pubsub()
        self.listener_task = None

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info("connection_manager_add", user_id=user_id, total_connections=len(self.active_connections[user_id]))
        
        # Subscribe to user's Redis channel
        channel = f"ws_user_{user_id}"
        self.pubsub.subscribe(channel)
        
        # Start Redis listener if not already running
        if self.listener_task is None or self.listener_task.done():
            self.listener_task = asyncio.create_task(self._redis_listener())

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
                logger.info("connection_manager_remove", user_id=user_id, remaining_connections=len(self.active_connections[user_id]))
                
                # Unsubscribe if no more connections for this user
                if len(self.active_connections[user_id]) == 0:
                    channel = f"ws_user_{user_id}"
                    self.pubsub.unsubscribe(channel)

    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to all connections for a specific user"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    logger.info("websocket_message_sent", user_id=user_id, message_type=message.get("type"))
                except Exception as e:
                    logger.error("websocket_send_failed", user_id=user_id, error=str(e))
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.active_connections[user_id].remove(conn)
        else:
            logger.warning("websocket_user_not_connected", user_id=user_id)

    async def _redis_listener(self):
        """Listen for Redis pub/sub messages and forward to WebSocket clients"""
        logger.info("redis_listener_started")
        
        while True:
            try:
                message = self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                
                if message and message['type'] == 'message':
                    # Parse channel to get user_id
                    channel = message['channel'].decode('utf-8')
                    user_id = int(channel.split('_')[-1])
                    
                    # Parse message data
                    data = json.loads(message['data'].decode('utf-8'))
                    
                    # Forward to WebSocket
                    await self.send_personal_message(data, user_id)
                
                await asyncio.sleep(0.1)  # Small delay to prevent busy loop
                
            except Exception as e:
                logger.error("redis_listener_error", error=str(e))
                await asyncio.sleep(1)

manager = ConnectionManager()