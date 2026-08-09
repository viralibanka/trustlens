// =========================================================
// TRUSTLENS — FRONTEND LOGIC
// =========================================================

// FastAPI backend URL
const API_URL = "https://YOUR-RENDER-URL.onrender.com/api/analyze";


// =========================================================
// GET HTML ELEMENTS
// =========================================================

const inputType = document.getElementById("inputType");
const inputText = document.getElementById("inputText");

const analyzeBtn = document.getElementById("analyzeBtn");
const buttonText = document.getElementById("buttonText");
const buttonLoader = document.getElementById("buttonLoader");

const errorMessage = document.getElementById("errorMessage");

const resultsSection = document.getElementById("resultsSection");

const trustScore = document.getElementById("trustScore");
const riskBadge = document.getElementById("riskBadge");

const resultTitle = document.getElementById("resultTitle");
const summary = document.getElementById("summary");

const riskSignals = document.getElementById("riskSignals");
const evidenceGaps = document.getElementById("evidenceGaps");
const verificationSteps = document.getElementById("verificationSteps");
const actionPlan = document.getElementById("actionPlan");


// =========================================================
// ANALYZE BUTTON
// =========================================================

analyzeBtn.addEventListener("click", analyzeContent);


// =========================================================
// MAIN ANALYSIS FUNCTION
// =========================================================

async function analyzeContent() {

    const text = inputText.value.trim();
    const type = inputType.value;


    // -----------------------------------------------------
    // Validate input
    // -----------------------------------------------------

    if (!text) {

        showError(
            "Please enter a message, claim, internship offer, or URL to analyze."
        );

        inputText.focus();

        return;
    }


    // -----------------------------------------------------
    // Clear previous error
    // -----------------------------------------------------

    hideError();


    // -----------------------------------------------------
    // Loading state
    // -----------------------------------------------------

    setLoading(true);


    try {

        // -------------------------------------------------
        // Send request to FastAPI
        // -------------------------------------------------

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                input_text: text,
                input_type: type
            })
        });


        // -------------------------------------------------
        // Handle HTTP errors
        // -------------------------------------------------

        if (!response.ok) {

            let errorData = {};

            try {
                errorData = await response.json();
            } catch {
                errorData = {};
            }

            throw new Error(
                errorData.detail ||
                `Server returned HTTP ${response.status}`
            );
        }


        // -------------------------------------------------
        // Convert response to JSON
        // -------------------------------------------------

        const data = await response.json();


        // -------------------------------------------------
        // Display results
        // -------------------------------------------------

        displayResults(data);


    } catch (error) {

        console.error("TrustLens Error:", error);

        showError(
            "Unable to connect to TrustLens backend. " +
            "Make sure the FastAPI server is running."
        );

    } finally {

        setLoading(false);

    }
}


// =========================================================
// DISPLAY RESULTS
// =========================================================

function displayResults(data) {

    // Show results section
    resultsSection.classList.remove("hidden");


    // -----------------------------------------------------
    // Trust score
    // -----------------------------------------------------

    const score = Number(data.trust_score ?? 0);

    trustScore.textContent = score;


    // -----------------------------------------------------
    // Risk level
    // -----------------------------------------------------

    const level = String(
        data.risk_level || "Unknown"
    ).toLowerCase();

    riskBadge.textContent = level.toUpperCase();


    // Remove previous risk classes
    riskBadge.classList.remove(
        "risk-low",
        "risk-medium",
        "risk-high"
    );


    // Add risk class
    riskBadge.classList.add(
        `risk-${level}`
    );


    // -----------------------------------------------------
    // Result title
    // -----------------------------------------------------

    if (level === "high") {

        resultTitle.textContent =
            "High Risk Detected";

    } else if (level === "medium") {

        resultTitle.textContent =
            "Proceed With Caution";

    } else if (level === "low") {

        resultTitle.textContent =
            "No Major Risk Detected";

    } else {

        resultTitle.textContent =
            "Analysis Complete";
    }


    // -----------------------------------------------------
    // Summary
    // -----------------------------------------------------

    summary.textContent =
        data.summary ||
        "Analysis completed successfully.";


    // -----------------------------------------------------
    // Risk signals
    // -----------------------------------------------------

    renderRiskSignals(
        data.risk_signals || []
    );


    // -----------------------------------------------------
    // Evidence gaps
    // -----------------------------------------------------

    renderSimpleList(
        evidenceGaps,
        data.evidence_gaps || [],
        "No major evidence gaps were identified."
    );


    // -----------------------------------------------------
    // Verification steps
    // -----------------------------------------------------

    renderSimpleList(
        verificationSteps,
        data.verification_steps || [],
        "No additional verification steps were provided."
    );


    // -----------------------------------------------------
    // Action plan
    // -----------------------------------------------------

    renderSimpleList(
        actionPlan,
        data.action_plan || [],
        "Continue to verify the information before taking action."
    );


    // -----------------------------------------------------
    // Scroll to results
    // -----------------------------------------------------

    setTimeout(() => {

        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 100);

}


// =========================================================
// RENDER RISK SIGNALS
// =========================================================

function renderRiskSignals(signals) {

    riskSignals.innerHTML = "";


    if (!signals.length) {

        riskSignals.innerHTML = `
            <div class="result-item empty-item">
                No major risk signals were detected.
            </div>
        `;

        return;
    }


    signals.forEach(signal => {

        const severity =
            String(signal.severity || "Low")
                .toLowerCase();


        const item = document.createElement("div");

        item.className =
            "result-item signal-item";


        item.innerHTML = `

            <div>

                <div class="signal-title">
                    ${escapeHTML(
                        signal.title || "Risk signal detected"
                    )}
                </div>

                <div class="signal-explanation">
                    ${escapeHTML(
                        signal.explanation ||
                        "Additional verification is recommended."
                    )}
                </div>

            </div>

            <span class="severity ${severity}">
                ${escapeHTML(
                    signal.severity || "Low"
                )}
            </span>

        `;


        riskSignals.appendChild(item);

    });

}


// =========================================================
// RENDER SIMPLE LISTS
// =========================================================

function renderSimpleList(
    container,
    items,
    emptyMessage
) {

    container.innerHTML = "";


    if (!items.length) {

        container.innerHTML = `
            <div class="result-item empty-item">
                ${escapeHTML(emptyMessage)}
            </div>
        `;

        return;
    }


    items.forEach(item => {

        const element =
            document.createElement("div");


        element.className =
            "result-item";


        element.innerHTML = `
            ${escapeHTML(item)}
        `;


        container.appendChild(element);

    });

}


// =========================================================
// LOADING STATE
// =========================================================

function setLoading(isLoading) {

    analyzeBtn.disabled = isLoading;


    if (isLoading) {

        buttonText.textContent =
            "Analyzing...";

        buttonLoader.classList.remove(
            "hidden"
        );

    } else {

        buttonText.textContent =
            "Analyze Trustworthiness";

        buttonLoader.classList.add(
            "hidden"
        );

    }

}


// =========================================================
// ERROR HANDLING
// =========================================================

function showError(message) {

    errorMessage.textContent = message;

    errorMessage.classList.remove(
        "hidden"
    );
}


function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

    errorMessage.textContent = "";
}


// =========================================================
// BASIC HTML ESCAPING
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}