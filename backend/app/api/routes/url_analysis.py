from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from urllib.parse import urlparse
import socket

router = APIRouter()


class URLRequest(BaseModel):
    url: str


@router.post("/analyze-url")
async def analyze_url(request: URLRequest):

    url = request.url.strip()

    if not url:
        raise HTTPException(
            status_code=400,
            detail="URL is required."
        )

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        parsed = urlparse(url)

        if not parsed.netloc:
            raise ValueError()

        hostname = parsed.hostname

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid website URL."
        )

    risk_signals = []
    evidence_gaps = []
    verification_steps = []
    action_plan = []

    score = 100

    # HTTPS check
    if parsed.scheme != "https":

        score -= 25

        risk_signals.append({
            "title": "Connection is not HTTPS",
            "explanation":
                "The website does not use an encrypted HTTPS connection.",
            "severity": "Medium"
        })

    else:

        verification_steps.append(
            "Confirm that the browser shows a valid HTTPS connection."
        )

    # Suspicious keywords
    suspicious_words = [
        "login",
        "verify",
        "urgent",
        "claim",
        "free",
        "reward",
        "winner",
        "payment",
        "refund",
        "bonus"
    ]

    lower_url = url.lower()

    found_words = [
        word
        for word in suspicious_words
        if word in lower_url
    ]

    if found_words:

        score -= min(
            30,
            len(found_words) * 5
        )

        risk_signals.append({
            "title":
                "Potentially sensitive URL keywords",

            "explanation":
                "The URL contains keywords commonly associated with verification, payment, reward, or urgent-action pages.",

            "severity":
                "Medium"
        })

        evidence_gaps.append(
            "The legitimacy of the website should be independently verified."
        )

    # IP address check
    if hostname:

        try:

            socket.inet_aton(hostname)

            score -= 20

            risk_signals.append({
                "title":
                    "IP address used instead of domain",

                "explanation":
                    "The URL uses a raw IP address instead of a recognizable domain.",

                "severity":
                    "Medium"
            })

        except socket.error:

            pass

    # Very long URL
    if len(url) > 150:

        score -= 10

        risk_signals.append({
            "title":
                "Unusually long URL",

            "explanation":
                "Very long URLs can sometimes hide redirects, tracking parameters, or suspicious destinations.",

            "severity":
                "Low"
        })

    # Evidence gaps
    evidence_gaps.extend([
        "Domain ownership has not been independently verified.",
        "Website reputation has not been independently confirmed."
    ])

    # Verification
    verification_steps.extend([
        "Check the domain name carefully for spelling variations.",
        "Verify the organization through its official website or trusted source.",
        "Do not enter passwords, payment details, or sensitive information until verified."
    ])

    score = max(
        0,
        min(100, score)
    )

    # Risk level
    if score < 40:

        risk_level = "high"

        action_plan.extend([
            "Do not enter personal or payment information.",
            "Do not download files from this website.",
            "Verify the website through an independent trusted source."
        ])

    elif score < 70:

        risk_level = "medium"

        action_plan.extend([
            "Proceed carefully.",
            "Verify the website and organization before taking action.",
            "Avoid entering sensitive information until verification is complete."
        ])

    else:

        risk_level = "low"

        action_plan.extend([
            "No major observable URL risk signals were detected.",
            "Continue normal verification before sharing sensitive information."
        ])

    return {

        "success": True,

        "url": url,

        "trust_score": score,

        "risk_level": risk_level,

        "summary":
            "TrustLens analyzed observable URL-level trust signals. A low-risk result does not guarantee that a website is legitimate.",

        "risk_signals":
            risk_signals,

        "evidence_gaps":
            evidence_gaps,

        "verification_steps":
            verification_steps,

        "action_plan":
            action_plan
    }