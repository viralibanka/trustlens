from fastapi import APIRouter

from app.api.routes.analysis import router as analysis_router
from app.api.routes.screenshots import router as screenshot_router
from app.api.routes.url_analysis import router as url_analysis_router
from app.api.routes.documents import router as document_router


# =====================================================
# MAIN API ROUTER
# =====================================================

api_router = APIRouter()


# =====================================================
# ANALYSIS ROUTES
# =====================================================

api_router.include_router(
    analysis_router
)


# =====================================================
# SCREENSHOT / OCR ROUTES
# =====================================================

api_router.include_router(
    screenshot_router
)


# =====================================================
# URL ANALYSIS ROUTES
# =====================================================

api_router.include_router(
    url_analysis_router
)


# =====================================================
# DOCUMENT / PDF ROUTES
# =====================================================

api_router.include_router(
    document_router
)
