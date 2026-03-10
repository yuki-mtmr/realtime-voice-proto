"""
CourseServiceのテスト
"""
import pytest
from pathlib import Path
from app.services.course_service import CourseService


class TestCourseService:
    """CourseServiceのテストクラス"""

    @pytest.fixture
    def service(self) -> CourseService:
        """テスト用のCourseServiceインスタンスを作成"""
        mock_data_path = Path(__file__).parent.parent / "mock_data" / "courses.json"
        return CourseService(data_path=str(mock_data_path))

    def test_load_courses(self, service: CourseService):
        """コースデータをロードできる"""
        courses = service.get_all_courses()
        assert len(courses) > 0

    def test_search_courses_by_area(self, service: CourseService):
        """エリアでコースを検索できる"""
        result = service.search_courses(area="神奈川")
        assert len(result) > 0
        for course in result:
            assert course.area == "神奈川"

    def test_search_courses_by_area_tokyo(self, service: CourseService):
        """東京エリアでコースを検索できる"""
        result = service.search_courses(area="東京")
        assert len(result) > 0
        for course in result:
            assert course.area == "東京"

    def test_search_courses_by_tags(self, service: CourseService):
        """タグでコースを検索できる"""
        result = service.search_courses(tags=["温泉"])
        assert len(result) > 0
        for course in result:
            assert "温泉" in course.tags

    def test_search_courses_by_multiple_tags(self, service: CourseService):
        """複数タグでコースを検索できる（OR検索）"""
        result = service.search_courses(tags=["温泉", "歴史"])
        assert len(result) > 0
        for course in result:
            assert any(tag in course.tags for tag in ["温泉", "歴史"])

    def test_search_courses_by_max_budget(self, service: CourseService):
        """最大予算でコースを検索できる"""
        result = service.search_courses(max_budget=8000)
        assert len(result) > 0
        for course in result:
            assert course.estimated_budget.min_amount <= 8000

    def test_search_courses_by_max_duration(self, service: CourseService):
        """最大所要時間でコースを検索できる"""
        result = service.search_courses(max_duration_hours=6.0)
        assert len(result) > 0
        for course in result:
            assert course.duration_hours <= 6.0

    def test_search_courses_combined_filters(self, service: CourseService):
        """複合条件でコースを検索できる"""
        result = service.search_courses(area="神奈川", max_duration_hours=8.0)
        assert len(result) > 0
        for course in result:
            assert course.area == "神奈川"
            assert course.duration_hours <= 8.0

    def test_search_courses_no_match(self, service: CourseService):
        """該当するコースがない場合は空リストを返す"""
        result = service.search_courses(area="北海道")
        assert len(result) == 0

    def test_get_course_by_id_found(self, service: CourseService):
        """IDでコースを取得できる"""
        course = service.get_course_by_id("course-001")
        assert course is not None
        assert course.id == "course-001"
        assert course.name == "鎌倉歴史散策コース"

    def test_get_course_by_id_not_found(self, service: CourseService):
        """存在しないIDの場合はNoneを返す"""
        course = service.get_course_by_id("non-existent-id")
        assert course is None

    def test_course_has_spots(self, service: CourseService):
        """コースにスポットが含まれている"""
        course = service.get_course_by_id("course-001")
        assert course is not None
        assert len(course.spots) > 0
        assert course.spots[0].name is not None
        assert course.spots[0].duration_minutes > 0

    def test_course_has_estimated_budget(self, service: CourseService):
        """コースに予算情報が含まれている"""
        course = service.get_course_by_id("course-001")
        assert course is not None
        assert course.estimated_budget.min_amount > 0
        assert course.estimated_budget.max_amount >= course.estimated_budget.min_amount
