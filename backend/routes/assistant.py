from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from services.llm_service import get_llm_response
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Conversational AI endpoint powered by Groq LLaMA.
    Accepts a user message + optional conversation history.
    Returns GeoBot's reply.
    """
    try:
        logger.info(f"Chat request | session={request.session_id} | msg_len={len(request.message)}")

        history = [msg.dict() for msg in request.history] if request.history else []

        reply = await get_llm_response(
            user_message=request.message,
            history=history,
        )

        session_id = request.session_id or str(uuid.uuid4())

        return ChatResponse(
            success=True,
            reply=reply,
            session_id=session_id,
            tool_used=None,
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def assistant_health():
    return {"status": "ok", "service": "AI Assistant (Groq)"}