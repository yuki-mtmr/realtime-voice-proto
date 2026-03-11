# Backend Instructions — realtime-voice-proto

このファイルはBackend開発時に参照される詳細ガイドです。

## ルーター作成テンプレート

### 基本ルーター

```python
# app/routers/courses.py
from fastapi import APIRouter, HTTPException
from app.models.course import Course, CourseQuery
from app.services.course import search_courses, get_course_by_id

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("/search", response_model=list[Course])
async def search(query: CourseQuery) -> list[Course]:
    """
    コースを検索する。

    Args:
        query: 検索条件（エリア、タグ、日数）

    Returns:
        条件に一致するコースのリスト
    """
    return search_courses(query)


@router.get("/{course_id}", response_model=Course)
async def get_detail(course_id: str) -> Course:
    """
    コースの詳細を取得する。

    Args:
        course_id: コースID

    Returns:
        コース詳細

    Raises:
        HTTPException: コースが見つからない場合
    """
    course = get_course_by_id(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
```

### ルーター登録

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import courses, tools, health

app = FastAPI(title="realtime-voice-proto API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(health.router)
app.include_router(courses.router)
app.include_router(tools.router)
```

## サービス作成テンプレート

### 基本サービス

```python
# app/services/course.py
import json
from pathlib import Path
from app.models.course import Course, CourseQuery

# モックデータ読み込み
_DATA_PATH = Path(__file__).parent.parent.parent / "mock_data" / "courses.json"


def _load_courses() -> list[Course]:
    """モックデータからコースを読み込む。"""
    with open(_DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return [Course(**item) for item in data]


def search_courses(query: CourseQuery) -> list[Course]:
    """
    条件に一致するコースを検索する。

    Args:
        query: 検索条件

    Returns:
        条件に一致するコースのリスト
    """
    courses = _load_courses()
    results = courses

    if query.area:
        results = [c for c in results if c.area == query.area]

    if query.tags:
        results = [
            c for c in results
            if any(tag in c.tags for tag in query.tags)
        ]

    if query.days:
        results = [c for c in results if c.days == query.days]

    return results


def get_course_by_id(course_id: str) -> Course | None:
    """
    IDでコースを取得する。

    Args:
        course_id: コースID

    Returns:
        コース。見つからない場合はNone
    """
    courses = _load_courses()
    for course in courses:
        if course.id == course_id:
            return course
    return None
```

## Pydantic スキーマパターン

### 基本スキーマ

```python
# app/models/course.py
from pydantic import BaseModel, Field


class Spot(BaseModel):
    """観光スポット。"""

    name: str = Field(..., description="スポット名")
    description: str = Field(..., description="スポットの説明")
    duration_minutes: int = Field(..., ge=0, description="滞在時間（分）")


class Course(BaseModel):
    """旅行コース。"""

    id: str = Field(..., description="コースID")
    name: str = Field(..., description="コース名")
    area: str = Field(..., description="エリア（tokyo, kanagawa等）")
    days: int = Field(..., ge=1, le=7, description="日数")
    tags: list[str] = Field(default_factory=list, description="タグ")
    spots: list[Spot] = Field(default_factory=list, description="観光スポット")
    summary: str = Field(..., description="コース概要")


class CourseQuery(BaseModel):
    """コース検索クエリ。"""

    area: str | None = Field(None, description="エリアで絞り込み")
    tags: list[str] | None = Field(None, description="タグで絞り込み")
    days: int | None = Field(None, ge=1, le=7, description="日数で絞り込み")
```

### ElevenLabs Tool リクエスト

```python
# app/models/tool_request.py
from pydantic import BaseModel, Field
from typing import Any


class ToolRequest(BaseModel):
    """ElevenLabsからのツール呼び出しリクエスト。"""

    tool_name: str = Field(..., description="ツール名")
    parameters: dict[str, Any] = Field(
        default_factory=dict,
        description="ツールパラメータ"
    )


class ToolResponse(BaseModel):
    """ツール呼び出しレスポンス。"""

    success: bool = Field(..., description="成功フラグ")
    data: Any = Field(None, description="レスポンスデータ")
    error: str | None = Field(None, description="エラーメッセージ")
```

## テスト用フィクスチャ

### conftest.py

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client() -> TestClient:
    """FastAPIテストクライアント。"""
    return TestClient(app)


@pytest.fixture
def sample_course() -> dict:
    """サンプルコースデータ。"""
    return {
        "id": "test-001",
        "name": "テストコース",
        "area": "tokyo",
        "days": 1,
        "tags": ["グルメ", "歴史"],
        "spots": [
            {
                "name": "テストスポット",
                "description": "説明",
                "duration_minutes": 60
            }
        ],
        "summary": "テストコースの概要"
    }


@pytest.fixture
def sample_query() -> dict:
    """サンプル検索クエリ。"""
    return {
        "area": "tokyo",
        "tags": ["グルメ"],
        "days": 1
    }
```

### ルーターテスト

```python
# tests/test_courses.py
import pytest
from fastapi.testclient import TestClient


def test_search_courses_returns_list(client: TestClient, sample_query: dict):
    """検索結果がリストで返ること。"""
    response = client.post("/courses/search", json=sample_query)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_search_courses_filters_by_area(client: TestClient):
    """エリアで絞り込みできること。"""
    response = client.post("/courses/search", json={"area": "tokyo"})
    assert response.status_code == 200
    courses = response.json()
    assert all(c["area"] == "tokyo" for c in courses)


def test_get_course_not_found(client: TestClient):
    """存在しないIDで404が返ること。"""
    response = client.get("/courses/nonexistent-id")
    assert response.status_code == 404
```

### サービステスト

```python
# tests/test_course_service.py
import pytest
from app.models.course import CourseQuery
from app.services.course import search_courses, get_course_by_id


def test_search_by_area():
    """エリアで検索できること。"""
    query = CourseQuery(area="tokyo")
    results = search_courses(query)
    assert all(c.area == "tokyo" for c in results)


def test_search_by_multiple_tags():
    """複数タグで検索できること。"""
    query = CourseQuery(tags=["グルメ", "歴史"])
    results = search_courses(query)
    assert all(
        any(tag in c.tags for tag in ["グルメ", "歴史"])
        for c in results
    )


def test_get_by_id_returns_none_for_unknown():
    """存在しないIDでNoneが返ること。"""
    result = get_course_by_id("unknown-id")
    assert result is None
```

## モックデータ構造

```json
// mock_data/courses.json
[
  {
    "id": "tokyo-gourmet-001",
    "name": "東京下町グルメ巡り",
    "area": "tokyo",
    "days": 1,
    "tags": ["グルメ", "下町"],
    "spots": [
      {
        "name": "築地場外市場",
        "description": "新鮮な海鮮と下町の雰囲気",
        "duration_minutes": 90
      },
      {
        "name": "浅草寺",
        "description": "東京最古の寺院",
        "duration_minutes": 60
      }
    ],
    "summary": "築地から浅草まで、東京の下町グルメと文化を満喫"
  }
]
```

## 環境設定

```python
# app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定。"""

    app_name: str = "realtime-voice-proto"
    debug: bool = False
    backend_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
```
