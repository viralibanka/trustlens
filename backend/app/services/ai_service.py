import re
from urllib.parse import urlparse


def analyze_with_ai(text: str, input_type: str = "text"):
    text_lower = text.lower()

    risk_signals = []
    verification_steps = []
    evidence_gaps = []
    action_plan = []
    claims = []

    score = 85

    # 1. Urgency detection
    urgency_words = [
        "urgent",
        "immediately",
        "within 24 hours",
        "within 2 hours",
        "act now",
        "limited time",
        "hurry"
    ]

    found_urgency = [
        word for word in urgency_words
        if word in text_lower
    ]

    if found_urgency:
        score -= 15
        risk_signals.append({
            "title": "Urgency pressure detected",
            "severity": "Medium",
            "explanation": "The content uses urgency or time pressure to encourage quick action."
        })

        verification_steps.append(
            "Do not act immediately. Independently verify the claim first."
        )

    # 2. Payment detection
    payment_words = [
        "pay",
        "payment",
        "registration fee",
        "processing fee",
        "deposit",
        "fee",
        "transfer money",
        "upi"
    ]

    found_payment = [
        word for word in payment_words
        if word in text_lower
    ]

    if found_payment:
        score -= 25

        risk_signals.append({
            "title": "Payment request detected",
            "severity": "High",
            "explanation": "The content requests money, a fee, or financial action."
        })

        verification_steps.append(
            "Verify the organization and payment request through an official channel."
        )

        action_plan.append(
            "Do not send money until the request is independently verified."
        )

    # 3. Sensitive information detection
    sensitive_words = [
        "password",
        "otp",
        "one time password",
        "cvv",
        "credit card",
        "debit card",
        "bank details",
        "login credentials"
    ]

    found_sensitive = [
        word for word in sensitive_words
        if word in text_lower
    ]

    if found_sensitive:
        score -= 30

        risk_signals.append({
            "title": "Sensitive information request",
            "severity": "High",
            "explanation": "The content appears to request credentials or sensitive financial information."
        })

        verification_steps.append(
            "Never share OTPs, passwords, CVV, or login credentials through unsolicited messages."
        )

        action_plan.append(
            "Do not disclose sensitive information."
        )

    # 4. Reward / selection language
    reward_words = [
        "you won",
        "winner",
        "selected",
        "congratulations",
        "guaranteed job",
        "guaranteed profit",
        "free prize"
    ]

    found_reward = [
        word for word in reward_words
        if word in text_lower
    ]

    if found_reward:
        score -= 10

        risk_signals.append({
            "title": "High-reward or selection claim",
            "severity": "Medium",
            "explanation": "The content makes a reward, selection, or guaranteed-benefit claim that requires independent evidence."
        })

        evidence_gaps.append(
            "The claimed organization or opportunity has not been independently verified."
        )

    # 5. Enhanced URL verification
    urls = re.findall(r'https?://[^\s]+', text)

    for url in urls:
        clean_url = url.rstrip(".,!?;)")
        parsed = urlparse(clean_url)

        hostname = (parsed.hostname or "").lower()

        # HTTPS check
        if parsed.scheme != "https":
            score -= 10

            risk_signals.append({
                "title": "Unsecured connection detected",
                "severity": "Medium",
                "explanation": "The provided URL does not use HTTPS."
            })

            verification_steps.append(
                "Check whether the official organization provides a secure HTTPS website."
            )

        # IP address instead of domain
        if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", hostname):
            score -= 25

            risk_signals.append({
                "title": "IP-based URL detected",
                "severity": "High",
                "explanation": "The link uses an IP address instead of a recognizable domain name."
            })

            evidence_gaps.append(
                "The identity of the website owner could not be established from the URL."
            )

        # URL shortener detection
        shorteners = [
            "bit.ly",
            "tinyurl.com",
            "t.co",
            "goo.gl",
            "is.gd",
            "cutt.ly"
        ]

        if any(
            hostname == domain or hostname.endswith("." + domain)
            for domain in shorteners
        ):
            score -= 20

            risk_signals.append({
                "title": "URL shortener detected",
                "severity": "Medium",
                "explanation": "Shortened URLs can hide the final destination and should be verified before opening."
            })

            verification_steps.append(
                "Expand and independently verify the destination of the shortened URL."
            )

        # Suspicious URL wording
        suspicious_terms = [
            "login",
            "verify",
            "claim",
            "free",
            "bonus",
            "winner",
            "urgent",
            "secure",
            "reward",
            "gift"
        ]

        suspicious_url_terms = [
            term for term in suspicious_terms
            if term in hostname
        ]

        if suspicious_url_terms:
            score -= 15

            risk_signals.append({
                "title": "Suspicious URL wording detected",
                "severity": "Medium",
                "explanation": "The domain contains wording commonly associated with login, reward, verification, or urgency-based pages."
            })

        # Complex domain structure
        if hostname.count(".") >= 3:
            score -= 10

            risk_signals.append({
                "title": "Complex domain structure detected",
                "severity": "Low",
                "explanation": "The domain contains multiple subdomain levels and should be checked carefully."
            })

        verification_steps.append(
            f"Verify that {hostname} belongs to the organization being claimed."
        )

    # 6. Input type specific checks
    if input_type.lower() == "internship":
        evidence_gaps.append(
            "Company identity, official job posting, recruiter identity, and offer authenticity should be verified."
        )

        verification_steps.append(
            "Check whether the internship exists on the organization's official careers page."
        )

    elif input_type.lower() == "url":
        evidence_gaps.append(
            "Domain ownership and reputation have not been independently confirmed."
        )

    else:
        evidence_gaps.append(
            "The original source and identity of the claim have not been independently confirmed."
        )

    # 7. Generic verification
    verification_steps.extend([
        "Check the organization through its official website.",
        "Compare the claim with information from independent trusted sources.",
        "Look for verifiable contact information and official documentation."
    ])

    # Remove duplicates
    verification_steps = list(dict.fromkeys(verification_steps))
    evidence_gaps = list(dict.fromkeys(evidence_gaps))
    action_plan = list(dict.fromkeys(action_plan))

    # 8. Score boundaries
    score = max(0, min(100, score))

    if score >= 70:
        risk_level = "Low"
    elif score >= 40:
        risk_level = "Medium"
    else:
        risk_level = "High"

    # 9. Summary
    if risk_level == "High":
        summary = (
            "Multiple risk indicators were detected. "
            "Do not trust or act on the content until independent verification is completed."
        )

    elif risk_level == "Medium":
        summary = (
            "Some risk indicators were detected. "
            "Additional evidence should be checked before taking action."
        )

    else:
        summary = (
            "No major risk indicators were detected from the available content, "
            "but the claim should still be independently verified."
        )

    claims.append(
        "The system analyzed the provided content for observable trust and risk signals."
    )

    return {
        "trust_score": score,
        "risk_level": risk_level,
        "summary": summary,
        "claims": claims,
        "risk_signals": risk_signals,
        "evidence_gaps": evidence_gaps,
        "verification_steps": verification_steps,
        "action_plan": action_plan
    }