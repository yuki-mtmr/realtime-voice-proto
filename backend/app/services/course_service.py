"""
コース検索サービス
"""
import json
from pathlib import Path
from typing import List, Optional

from app.models.course import Course, Spot, EstimatedBudget


class CourseService:
    """コース検索・取得サービス"""

    def __init__(self, data_path: str):
        """
        コースサービスを初期化する

        Args:
            data_path: コースデータJSONファイルのパス
        """
        self._data_path = Path(data_path)
        self._courses: List[Course] = []
        self._load_courses()

    def _load_courses(self) -> None:
        """JSONファイルからコースデータをロードする"""
        if not self._data_path.exists():
            raise FileNotFoundError(f"Course data file not found: {self._data_path}")

        with open(self._data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._courses = []
        for course_data in data.get("courses", []):
            # Spotのリストを作成
            spots = [
                Spot(**spot_data) for spot_data in course_data.get("spots", [])
            ]
            # EstimatedBudgetを作成
            budget_data = course_data.get("estimated_budget", {})
            estimated_budget = EstimatedBudget(**budget_data)

            # Courseを作成
            course = Course(
                id=course_data["id"],
                name=course_data["name"],
                description=course_data["description"],
                area=course_data["area"],
                duration_hours=course_data["duration_hours"],
                spots=spots,
                estimated_budget=estimated_budget,
                tags=course_data.get("tags", []),
                image_url=course_data.get("image_url"),
            )
            self._courses.append(course)

    def get_all_courses(self) -> List[Course]:
        """全てのコースを取得する"""
        return self._courses.copy()

    def search_courses(
        self,
        area: Optional[str] = None,
        tags: Optional[List[str]] = None,
        max_budget: Optional[int] = None,
        max_duration_hours: Optional[float] = None,
    ) -> List[Course]:
        """
        条件に合致するコースを検索する

        Args:
            area: エリアで絞り込み
            tags: タグで絞り込み（OR検索）
            max_budget: 最大予算で絞り込み（min_amount以下）
            max_duration_hours: 最大所要時間で絞り込み

        Returns:
            検索条件に合致するコースのリスト
        """
        result = self._courses.copy()

        # エリアでフィルタリング
        if area:
            result = [c for c in result if c.area == area]

        # タグでフィルタリング（OR検索）
        if tags:
            result = [
                c for c in result if any(tag in c.tags for tag in tags)
            ]

        # 最大予算でフィルタリング
        if max_budget is not None:
            result = [
                c for c in result if c.estimated_budget.min_amount <= max_budget
            ]

        # 最大所要時間でフィルタリング
        if max_duration_hours is not None:
            result = [
                c for c in result if c.duration_hours <= max_duration_hours
            ]

        return result

    def get_course_by_id(self, course_id: str) -> Optional[Course]:
        """
        IDでコースを取得する

        Args:
            course_id: コースID

        Returns:
            コース、見つからない場合はNone
        """
        for course in self._courses:
            if course.id == course_id:
                return course
        return None
