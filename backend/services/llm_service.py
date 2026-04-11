import os
import logging
from typing import List, Dict
from groq import Groq

logger = logging.getLogger(__name__)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are GeoBot, an expert AI assistant for Geospatial Analytics 
and Site Detection. Help users find optimal locations for infrastructure, retail, 
energy, and public services."""


async def get_llm_response(user_message: str, history: List[Dict] = []) -> str:
    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            temperature=0.5,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise RuntimeError(f"LLM error: {str(e)}")