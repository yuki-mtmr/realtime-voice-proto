"""
ElevenLabs Tools APIルーター
"""
from fastapi import APIRouter, Depends
from pathlib import Path

from app.models.course import (
    SearchCoursesRequest,
    SearchCoursesResponse,
    GetCourseDetailRequest,
    GetCourseDetailResponse,
)
from app.services.course_service import CourseService

router = APIRouter(prefix="/tools", tags=["tools"])

# CourseServiceのシングルトンインスタンス
_course_service: CourseService | None = None


def get_course_service() -> CourseService:
    """CourseServiceの依存性注入"""
    global _course_service
    if _course_service is None:
        data_path = Path(__file__).parent.parent.parent / "mock_data" / "courses.json"
        _course_service = CourseService(data_path=str(data_path))
    return _course_service


@router.post("/search-courses", response_model=SearchCoursesResponse)
async def search_courses(
    request: SearchCoursesRequest,
    service: CourseService = Depends(get_course_service),
) -> SearchCoursesResponse:
    """
    コースを検索する

    ElevenLabs Conversational AI Toolとして使用される
    """
    courses = service.search_courses(
        area=request.area,
        tags=request.tags,
        max_budget=request.max_budget,
        max_duration_hours=request.max_duration_hours,
    )
    return SearchCoursesResponse(courses=courses, total_count=len(courses))


@router.post("/get-course-detail", response_model=GetCourseDetailResponse)
async def get_course_detail(
    request: GetCourseDetailRequest,
    service: CourseService = Depends(get_course_service),
) -> GetCourseDetailResponse:
    """
    コースの詳細を取得する

    ElevenLabs Conversational AI Toolとして使用される
    """
    course = service.get_course_by_id(request.course_id)
    return GetCourseDetailResponse(course=course, found=course is not None)
