from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)

    input_type = Column(String(50), nullable=False)

    input_text = Column(Text, nullable=False)

    trust_score = Column(Integer, nullable=True)

    risk_level = Column(String(30), nullable=True)

    risk_signals = Column(Text, nullable=True)

    evidence_gaps = Column(Text, nullable=True)

    verification_steps = Column(Text, nullable=True)

    action_plan = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )