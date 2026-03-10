"""
ヘルスチェックルーター
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    status: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """ヘルスチェックエンドポイント"""
    return HealthResponse(status="healthy")
