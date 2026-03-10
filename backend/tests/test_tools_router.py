"""
tools APIルーターのテスト
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client() -> TestClient:
    """テストクライアントを作成"""
    return TestClient(app)


class TestHealthEndpoint:
    """ヘルスチェックエンドポイントのテスト"""

    def test_health_check(self, client: TestClient):
        """ヘルスチェックが正常に動作する"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestSearchCoursesEndpoint:
    """コース検索エンドポイントのテスト"""

    def test_search_courses_without_filters(self, client: TestClient):
        """フィルタなしで全コースを取得できる"""
        response = client.post("/tools/search-courses", json={})
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        assert "total_count" in data
        assert data["total_count"] > 0

    def test_search_courses_by_area(self, client: TestClient):
        """エリアでコースを検索できる"""
        response = client.post("/tools/search-courses", json={"area": "神奈川"})
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] > 0
        for course in data["courses"]:
            assert course["area"] == "神奈川"

    def test_search_courses_by_tags(self, client: TestClient):
        """タグでコースを検索できる"""
        response = client.post("/tools/search-courses", json={"tags": ["温泉"]})
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] > 0
        for course in data["courses"]:
            assert "温泉" in course["tags"]

    def test_search_courses_by_max_budget(self, client: TestClient):
        """最大予算でコースを検索できる"""
        response = client.post("/tools/search-courses", json={"max_budget": 6000})
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] > 0
        for course in data["courses"]:
            assert course["estimated_budget"]["min_amount"] <= 6000

    def test_search_courses_no_results(self, client: TestClient):
        """該当なしの場合は空リストを返す"""
        response = client.post("/tools/search-courses", json={"area": "北海道"})
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 0
        assert len(data["courses"]) == 0


class TestGetCourseDetailEndpoint:
    """コース詳細取得エンドポイントのテスト"""

    def test_get_course_detail_found(self, client: TestClient):
        """存在するコースの詳細を取得できる"""
        response = client.post(
            "/tools/get-course-detail", json={"course_id": "course-001"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is True
        assert data["course"]["id"] == "course-001"
        assert data["course"]["name"] == "鎌倉歴史散策コース"

    def test_get_course_detail_not_found(self, client: TestClient):
        """存在しないコースの場合はfound=falseを返す"""
        response = client.post(
            "/tools/get-course-detail", json={"course_id": "non-existent"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is False
        assert data["course"] is None

    def test_get_course_detail_has_spots(self, client: TestClient):
        """コース詳細にスポット情報が含まれる"""
        response = client.post(
            "/tools/get-course-detail", json={"course_id": "course-001"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["course"]["spots"]) > 0
        spot = data["course"]["spots"][0]
        assert "name" in spot
        assert "description" in spot
        assert "duration_minutes" in spot

    def test_get_course_detail_has_budget(self, client: TestClient):
        """コース詳細に予算情報が含まれる"""
        response = client.post(
            "/tools/get-course-detail", json={"course_id": "course-001"}
        )
        assert response.status_code == 200
        data = response.json()
        budget = data["course"]["estimated_budget"]
        assert "min_amount" in budget
        assert "max_amount" in budget
        assert "includes" in budget
