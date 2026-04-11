from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 GeoSpatial AI Assistant starting up...")
    yield
    logger.info("🛑 Shutting down...")


app = FastAPI(
    title="GeoSpatial Analytics & Site Detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "online", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


try:
    from routes.assistant import router as assistant_router
    app.include_router(assistant_router, prefix="/api/v1/assistant", tags=["Assistant"])
    logger.info("✅ assistant router loaded")
except Exception as e:
    logger.warning(f"⚠️ assistant router failed: {e}")

try:
    from routes.analysis import router as analysis_router
    app.include_router(analysis_router, prefix="/api/v1/analysis", tags=["Analysis"])
    logger.info("✅ analysis router loaded")
except Exception as e:
    logger.warning(f"⚠️ analysis router failed: {e}")

try:
    from routes.geo import router as geo_router
    app.include_router(geo_router, prefix="/api/v1/geo", tags=["Geo"])
    logger.info("✅ geo router loaded")
except Exception as e:
    logger.warning(f"⚠️ geo router failed: {e}")

try:
    from routes.agent import router as agent_router
    app.include_router(agent_router, prefix="/api/v1/agent", tags=["Agent"])
    logger.info("✅ agent router loaded")
except Exception as e:
    logger.warning(f"⚠️ agent router failed: {e}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)