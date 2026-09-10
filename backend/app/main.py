from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
from backend.app.core.config import settings
from backend.app.db.database import engine, Base, SessionLocal
from backend.app.db.seed import seed_database
from backend.app.realtime.connection_manager import manager
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.conversations import router as conversations_router
from backend.app.api.v1.filters import router as filters_router
from backend.app.api.v1.leads import router as leads_router
from backend.app.api.v1.calls import router as calls_router
from backend.app.api.v1.agents import router as agents_router
from backend.app.api.v1.analytics import router as analytics_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("relayai")

# Initialize database tables and seed
Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RelayAI - AI Communication Operations Platform API",
    version="1.0.0"
)

# CORS middleware for mobile and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(conversations_router, prefix=settings.API_V1_STR)
app.include_router(filters_router, prefix=settings.API_V1_STR)
app.include_router(leads_router, prefix=settings.API_V1_STR)
app.include_router(calls_router, prefix=settings.API_V1_STR)
app.include_router(agents_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "relay-ai-backend"}

# Central WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                action = msg.get("action")
                topic = msg.get("topic")

                if action == "subscribe" and topic:
                    manager.subscribe(topic, websocket)
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "topic": topic
                    }))
                elif action == "unsubscribe" and topic:
                    manager.unsubscribe(topic, websocket)
                    await websocket.send_text(json.dumps({
                        "type": "unsubscribed",
                        "topic": topic
                    }))
                elif action == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
