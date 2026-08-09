from pydantic import BaseModel, Field
from typing import Optional


class AnalysisRequest(BaseModel):
    input_text: str = Field(..., min_length=3)
    input_type: str = "text"


class AnalysisResponse(BaseModel):
    id: Optional[int] = None
    input_type: str
    input_text: str
    trust_score: int
    risk_level: str
    summary: str
    claims: list[str]
    risk_signals: list[dict]
    evidence_gaps: list[str]
    verification_steps: list[str]
    action_plan: list[str]