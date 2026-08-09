import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Scan
from app.schemas.analysis import AnalysisRequest
from app.services.ai_service import analyze_with_ai


# =========================================================
# ANALYSIS ROUTER
# =========================================================
# IMPORTANT:
# Do NOT add prefix="/api" here.
# main.py already adds /api globally.
#
# Final endpoint:
# POST /api/analyze
# =========================================================

router = APIRouter(
    tags=["Analysis"]
)


# =========================================================
# ANALYZE TEXT
# =========================================================

@router.post("/analyze")
def analyze(
    request: AnalysisRequest,
    db: Session = Depends(get_db)
):

    try:

        # -------------------------------------------------
        # AI ANALYSIS
        # -------------------------------------------------

        result = analyze_with_ai(
            request.input_text,
            request.input_type
        )

        # -------------------------------------------------
        # SAVE SCAN TO DATABASE
        # -------------------------------------------------

        scan = Scan(
            input_type=request.input_type,
            input_text=request.input_text,

            trust_score=result.get(
                "trust_score"
            ),

            risk_level=result.get(
                "risk_level"
            ),

            risk_signals=json.dumps(
                result.get(
                    "risk_signals",
                    []
                )
            ),

            evidence_gaps=json.dumps(
                result.get(
                    "evidence_gaps",
                    []
                )
            ),

            verification_steps=json.dumps(
                result.get(
                    "verification_steps",
                    []
                )
            ),

            action_plan=json.dumps(
                result.get(
                    "action_plan",
                    []
                )
            )
        )

        db.add(scan)

        db.commit()

        db.refresh(scan)

        # -------------------------------------------------
        # RETURN RESULT
        # -------------------------------------------------

        return {
            "id": scan.id,

            "input_type":
                request.input_type,

            "input_text":
                request.input_text,

            **result
        }

    except Exception as e:

        # -------------------------------------------------
        # ROLLBACK DATABASE IF SOMETHING FAILS
        # -------------------------------------------------

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
