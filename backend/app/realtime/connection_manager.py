from typing import Dict, Set, Any
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("realtime")

class ConnectionManager:
    """
    Central WebSocket Connection & Topic Subscription Manager.
    Allows clients to connect once and subscribe to specific topics.
    """

    def __init__(self):
        # Maps topic (e.g. "conversation:42", "call:10", "inbox") -> Set of WebSocket connections
        self.topic_subscribers: Dict[str, Set[WebSocket]] = {}
        # Active connections set
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for topic, subscribers in self.topic_subscribers.items():
            if websocket in subscribers:
                subscribers.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    def subscribe(self, topic: str, websocket: WebSocket):
        if topic not in self.topic_subscribers:
            self.topic_subscribers[topic] = set()
        self.topic_subscribers[topic].add(websocket)

    def unsubscribe(self, topic: str, websocket: WebSocket):
        if topic in self.topic_subscribers and websocket in self.topic_subscribers[topic]:
            self.topic_subscribers[topic].remove(websocket)

    async def broadcast_to_topic(self, topic: str, event_type: str, payload: Any):
        subscribers = self.topic_subscribers.get(topic, set())
        message = json.dumps({
            "type": event_type,
            "topic": topic,
            "payload": payload
        })
        disconnected = set()
        for connection in subscribers:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.disconnect(conn)

    async def broadcast_all(self, event_type: str, payload: Any):
        message = json.dumps({
            "type": event_type,
            "topic": "global",
            "payload": payload
        })
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()
