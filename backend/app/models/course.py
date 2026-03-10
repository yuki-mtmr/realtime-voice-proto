"""
コースモデル定義
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class Spot(BaseModel):
    """観光スポット"""
    name: str = Field(..., description="スポット名")
    description: str = Field(..., description="スポットの説明")
    duration_minutes: int = Field(..., description="滞在時間（分）")
    category: str = Field(..., description="カテゴリ（観光、食事、体験など）")


class EstimatedBudget(BaseModel):
    """予算の見積もり"""
    min_amount: int = Field(..., description="最低予算（円）")
    max_amount: int = Field(..., description="最高予算（円）")
    includes: List[str] = Field(default_factory=list, description="含まれるもの")


class Course(BaseModel):
    """旅行コース"""
    id: str = Field(..., description="コースID")
    name: str = Field(..., description="コース名")
    description: str = Field(..., description="コースの説明")
    area: str = Field(..., description="エリア（神奈川、東京、千葉、静岡など）")
    duration_hours: float = Field(..., description="所要時間（時間）")
    spots: List[Spot] = Field(default_factory=list, description="スポットリスト")
    estimated_budget: EstimatedBudget = Field(..., description="予算の見積もり")
    tags: List[str] = Field(default_factory=list, description="タグ（家族向け、カップル、アクティブなど）")
    image_url: Optional[str] = Field(None, description="コース画像URL")


class SearchCoursesRequest(BaseModel):
    """コース検索リクエスト"""
    area: Optional[str] = Field(None, description="エリアで絞り込み")
    tags: Optional[List[str]] = Field(None, description="タグで絞り込み")
    max_budget: Optional[int] = Field(None, description="最大予算で絞り込み")
    max_duration_hours: Optional[float] = Field(None, description="最大所要時間で絞り込み")


class SearchCoursesResponse(BaseModel):
    """コース検索レスポンス"""
    courses: List[Course] = Field(default_factory=list, description="検索結果のコースリスト")
    total_count: int = Field(..., description="検索結果の総数")


class GetCourseDetailRequest(BaseModel):
    """コース詳細取得リクエスト"""
    course_id: str = Field(..., description="取得するコースのID")


class GetCourseDetailResponse(BaseModel):
    """コース詳細レスポンス"""
    course: Optional[Course] = Field(None, description="コース詳細")
    found: bool = Field(..., description="コースが見つかったかどうか")
