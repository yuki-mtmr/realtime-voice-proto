"""
FastAPIアプリケーションエントリポイント
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, tools

# FastAPIアプリケーションを作成
app = FastAPI(
    title="AI Concierge Backend",
    description="JTB旅行代理店向けAI音声コンシェルジュのバックエンドAPI",
    version="1.0.0",
)

# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(health.router)
app.include_router(tools.router)


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "AI Concierge Backend API",
        "docs": "/docs",
        "health": "/health",
    }
