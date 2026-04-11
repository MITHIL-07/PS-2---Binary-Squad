from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class Message(BaseModel):
    role: str
    content: str

class AgentRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    session_id: Optional[str] = None


@router.post("/chat")
async def agent_chat(request: AgentRequest):
    return {
        "success": True,
        "reply": "Agent endpoint working!",
        "session_id": request.session_id,
    }


@router.get("/health")
async def agent_health():
    return {"status": "ok", "service": "Agent"}