// =========================================================
// TRUSTLENS — DIGITAL TRUST INTELLIGENCE
// FINAL STABLE FRONTEND SCRIPT
// TEXT + URL + SCREENSHOT OCR + PDF
// (FIXED: main Analyze button now routes PDFs correctly,
//  and file inputs are cleared after a successful analysis
//  so a later click re-analyzes fresh text instead of
//  silently re-running old OCR/PDF extraction.)
// =========================================================

"use strict";

// =========================================================
// API CONFIGURATION
// =========================================================

// LIVE RENDER BACKEND
const API_BASE = "https://trustlens-uw66.onrender.com/api";

// LOCAL TESTING:
// const API_BASE = "http://127.0.0.1:8000/api";


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("=================================");
    console.log("TRUSTLENS FRONTEND STARTED");
    console.log("API:", API_BASE);
    console.log("=================================");


    // =====================================================
    // DOM ELEMENTS
    // =====================================================

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
    const verificationSteps =
        document.getElementById("verificationSteps");
    const actionPlan =
        document.getElementById("actionPlan");

    const beforeAction =
        document.getElementById("beforeAction");

    const beforeTitle =
        document.getElementById("beforeTitle");

    const beforeText =
        document.getElementById("beforeText");

    const scoreProgress =
        document.getElementById("scoreProgress");

    const scoreReasons =
        document.getElementById("scoreReasons");

    const themeToggle =
        document.getElementById("themeToggle");

    const characterCount =
        document.getElementById("characterCount");

    const newAnalysisBtn =
        document.getElementById("newAnalysisBtn");

    const screenshotInput =
        document.getElementById("screenshotInput");

    const imagePreview =
        document.getElementById("imagePreview");

    const previewImage =
        document.getElementById("previewImage");

    const removeImage =
        document.getElementById("removeImage");

    const urlInputSection =
        document.getElementById("urlInputSection");

    const urlInput =
        document.getElementById("urlInput");

    const documentInput =
        document.getElementById("documentInput");

    const analyzeDocumentBtn =
        document.getElementById("analyzeDocumentBtn");


    // =====================================================
    // THEME
    // =====================================================

    function loadTheme() {

        const savedTheme =
            localStorage.getItem("trustlens-theme");

        if (savedTheme === "dark") {

            document.body.classList.add("dark");

            if (themeToggle) {
                themeToggle.textContent = "☀️";
            }

        } else {

            document.body.classList.remove("dark");

            if (themeToggle) {
                themeToggle.textContent = "🌙";
            }
        }
    }


    if (themeToggle) {

        themeToggle.addEventListener("click", () => {

            document.body.classList.toggle("dark");

            const isDark =
                document.body.classList.contains("dark");

            localStorage.setItem(
                "trustlens-theme",
                isDark ? "dark" : "light"
            );

            themeToggle.textContent =
                isDark ? "☀️" : "🌙";
        });
    }

    loadTheme();


    // =====================================================
    // INPUT MODE
    // =====================================================

    function updateInputMode() {

        if (!inputType) {
            return;
        }

        const type =
            String(inputType.value || "")
                .trim()
                .toLowerCase();

        console.log("Input mode:", type);

        if (type === "url") {

            if (urlInputSection) {
                urlInputSection.classList.remove("hidden");
            }

            if (inputText) {
                inputText.classList.add("hidden");
            }

        } else {

            if (urlInputSection) {
                urlInputSection.classList.add("hidden");
            }

            if (inputText) {
                inputText.classList.remove("hidden");
            }
        }
    }


    if (inputType) {

        inputType.addEventListener(
            "change",
            updateInputMode
        );
    }

    updateInputMode();


    // =====================================================
    // CHARACTER COUNT
    // =====================================================

    function updateCharacterCount() {

        if (!inputText || !characterCount) {
            return;
        }

        const length =
            inputText.value.length;

        characterCount.textContent =
            `${length.toLocaleString()} characters`;
    }


    if (inputText) {

        inputText.addEventListener(
            "input",
            updateCharacterCount
        );
    }


    updateCharacterCount();


    // =====================================================
    // IMAGE PREVIEW
    // =====================================================

    if (screenshotInput) {

        screenshotInput.addEventListener(
            "change",
            () => {

                hideError();

                const file =
                    screenshotInput.files &&
                    screenshotInput.files[0];

                if (!file) {

                    hideImagePreview();

                    return;
                }


                if (!file.type.startsWith("image/")) {

                    showError(
                        "Please upload a valid image file."
                    );

                    screenshotInput.value = "";

                    hideImagePreview();

                    return;
                }


                if (file.size > 10 * 1024 * 1024) {

                    showError(
                        "Image must be smaller than 10 MB."
                    );

                    screenshotInput.value = "";

                    hideImagePreview();

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload = (event) => {

                    if (previewImage) {
                        previewImage.src =
                            event.target.result;
                    }

                    if (imagePreview) {
                        imagePreview.classList.remove(
                            "hidden"
                        );
                    }
                };


                reader.onerror = () => {

                    showError(
                        "Unable to preview this image."
                    );

                    hideImagePreview();
                };


                reader.readAsDataURL(file);
            }
        );
    }


    function hideImagePreview() {

        if (previewImage) {
            previewImage.src = "";
        }

        if (imagePreview) {
            imagePreview.classList.add("hidden");
        }
    }


    // =====================================================
    // REMOVE IMAGE
    // =====================================================

    if (removeImage) {

        removeImage.addEventListener(
            "click",
            () => {

                if (screenshotInput) {
                    screenshotInput.value = "";
                }

                hideImagePreview();
                hideError();
            }
        );
    }


    // =====================================================
    // MAIN ANALYZE BUTTON
    // =====================================================

    if (analyzeBtn) {

        analyzeBtn.addEventListener(
            "click",
            handleAnalyze
        );
    }


    async function handleAnalyze(event) {

        if (event) {
            event.preventDefault();
        }


        // Prevent duplicate analysis
        if (
            analyzeBtn &&
            analyzeBtn.disabled
        ) {
            return;
        }


        // Screenshot gets priority
        if (
            screenshotInput &&
            screenshotInput.files &&
            screenshotInput.files.length > 0
        ) {

            await analyzeScreenshot();

            return;
        }


        // FIX (Bug 1): PDF gets priority over plain text too,
        // so clicking the main Analyze button also works when
        // a PDF is selected but the user didn't click the
        // separate "Analyze Document" button.
        if (
            documentInput &&
            documentInput.files &&
            documentInput.files.length > 0
        ) {

            await analyzeDocument();

            return;
        }


        await analyzeContent();
    }


    // =====================================================
    // TEXT / URL ANALYSIS
    // =====================================================

    async function analyzeContent() {

        if (!inputType) {

            showError(
                "Input type field not found in HTML."
            );

            return;
        }


        const type =
            String(inputType.value || "")
                .trim()
                .toLowerCase();


        // =================================================
        // URL
        // =================================================

        if (type === "url") {

            if (!urlInput) {

                showError(
                    "URL input field not found in HTML."
                );

                return;
            }


            const url =
                urlInput.value.trim();


            if (!url) {

                showError(
                    "Please enter a website URL."
                );

                urlInput.focus();

                return;
            }


            if (!isValidURL(url)) {

                showError(
                    "Please enter a valid URL, for example https://example.com"
                );

                urlInput.focus();

                return;
            }


            hideError();
            setLoading(true);


            try {

                console.log(
                    "Analyzing URL:",
                    url
                );


                const response =
                    await fetchWithTimeout(
                        `${API_BASE}/analyze-url`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                url: url
                            })
                        }
                    );


                const data =
                    await readResponse(response);


                console.log(
                    "URL RESPONSE:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        getServerError(
                            data,
                            `URL analysis failed. HTTP ${response.status}`
                        )
                    );
                }


                displayResults(data);


            } catch (error) {

                console.error(
                    "URL ERROR:",
                    error
                );

                showError(
                    getErrorMessage(
                        error,
                        "Unable to analyze this website."
                    )
                );

            } finally {

                setLoading(false);
            }

            return;
        }


        // =================================================
        // TEXT
        // =================================================

        if (!inputText) {

            showError(
                "Text input field not found in HTML."
            );

            return;
        }


        const text =
            inputText.value.trim();


        if (!text) {

            showError(
                "Please enter text to analyze."
            );

            inputText.focus();

            return;
        }


        if (text.length < 3) {

            showError(
                "Please enter at least a few words to analyze."
            );

            inputText.focus();

            return;
        }


        hideError();
        setLoading(true);


        try {

            console.log(
                "Analyzing text..."
            );


            const response =
                await fetchWithTimeout(
                    `${API_BASE}/analyze`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body: JSON.stringify({

                            input_text:
                                text,

                            input_type:
                                type || "text"
                        })
                    }
                );


            const data =
                await readResponse(response);


            console.log(
                "TEXT RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    getServerError(
                        data,
                        `Text analysis failed. HTTP ${response.status}`
                    )
                );
            }


            displayResults(data);


        } catch (error) {

            console.error(
                "TEXT ERROR:",
                error
            );

            showError(
                getErrorMessage(
                    error,
                    "Unable to connect to TrustLens backend."
                )
            );

        } finally {

            setLoading(false);
        }
    }


    // =====================================================
    // URL VALIDATION
    // =====================================================

    function isValidURL(value) {

        try {

            const url =
                new URL(value);

            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );

        } catch {

            return false;
        }
    }


    // =====================================================
    // SCREENSHOT → OCR → TRUST ANALYSIS
    // =====================================================

    async function analyzeScreenshot() {

        if (!screenshotInput) {

            showError(
                "Screenshot upload field not found."
            );

            return;
        }


        const file =
            screenshotInput.files &&
            screenshotInput.files[0];


        if (!file) {

            showError(
                "Please select a screenshot first."
            );

            return;
        }


        if (!file.type.startsWith("image/")) {

            showError(
                "Please select a valid image."
            );

            return;
        }


        if (file.size > 10 * 1024 * 1024) {

            showError(
                "Image must be smaller than 10 MB."
            );

            return;
        }


        hideError();
        setLoading(true);


        try {

            // =================================================
            // STEP 1 — OCR
            // =================================================

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );


            console.log(
                "Sending screenshot to:",
                `${API_BASE}/analyze-screenshot`
            );


            const screenshotResponse =
                await fetchWithTimeout(
                    `${API_BASE}/analyze-screenshot`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const screenshotData =
                await readResponse(
                    screenshotResponse
                );


            console.log(
                "OCR RESPONSE:",
                screenshotData
            );


            if (!screenshotResponse.ok) {

                throw new Error(
                    getServerError(
                        screenshotData,
                        `Screenshot OCR failed. HTTP ${screenshotResponse.status}`
                    )
                );
            }


            // =================================================
            // STEP 2 — OCR TEXT
            // =================================================

            const extractedText =
                getExtractedText(
                    screenshotData
                );


            if (!extractedText.trim()) {

                throw new Error(
                    "No readable text was found in this screenshot."
                );
            }


            console.log(
                "Extracted OCR text:",
                extractedText
            );


            // =================================================
            // SHOW OCR TEXT
            // =================================================

            if (inputText) {

                inputText.value =
                    extractedText;

                updateCharacterCount();
            }


            // =================================================
            // STEP 3 — TRUST ANALYSIS
            // =================================================

            const analysisData =
                await analyzeExtractedText(
                    extractedText
                );


            // =================================================
            // STEP 4 — DISPLAY
            // =================================================

            displayResults(
                analysisData
            );


            // FIX (Bug 2): clear the file input + hide the
            // preview now that this screenshot has been used.
            // Otherwise a later click on the main Analyze
            // button silently re-runs OCR on the same image
            // instead of analyzing any edits the user made to
            // the extracted text.
            screenshotInput.value = "";
            hideImagePreview();


        } catch (error) {

            console.error(
                "SCREENSHOT ERROR:",
                error
            );

            showError(
                getErrorMessage(
                    error,
                    "Unable to analyze screenshot."
                )
            );

        } finally {

            setLoading(false);
        }
    }


    // =====================================================
    // PDF → TEXT → TRUST ANALYSIS
    // =====================================================

    async function analyzeDocument() {

        if (!documentInput) {

            showError(
                "PDF upload field not found."
            );

            return;
        }


        const file =
            documentInput.files &&
            documentInput.files[0];


        if (!file) {

            showError(
                "Please select a PDF first."
            );

            return;
        }


        const isPDF =
            file.type === "application/pdf" ||
            file.name
                .toLowerCase()
                .endsWith(".pdf");


        if (!isPDF) {

            showError(
                "Please upload a valid PDF file."
            );

            return;
        }


        if (file.size > 10 * 1024 * 1024) {

            showError(
                "PDF must be smaller than 10 MB."
            );

            return;
        }


        hideError();
        setLoading(true);


        try {

            // =================================================
            // STEP 1 — SEND PDF
            // =================================================

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );


            console.log(
                "Sending PDF to:",
                `${API_BASE}/analyze-document`
            );


            const response =
                await fetchWithTimeout(
                    `${API_BASE}/analyze-document`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await readResponse(response);


            console.log(
                "PDF RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    getServerError(
                        data,
                        `PDF analysis failed. HTTP ${response.status}`
                    )
                );
            }


            // =================================================
            // STEP 2 — EXTRACT TEXT
            // =================================================

            const extractedText =
                getExtractedText(data);


            if (!extractedText.trim()) {

                throw new Error(
                    data.message ||
                    "No readable text was found in this PDF."
                );
            }


            // =================================================
            // STEP 3 — SHOW EXTRACTED TEXT
            // =================================================

            if (inputText) {

                inputText.value =
                    extractedText;

                updateCharacterCount();
            }


            // =================================================
            // STEP 4 — TRUST ANALYSIS
            // =================================================

            const analysisData =
                await analyzeExtractedText(
                    extractedText
                );


            // =================================================
            // STEP 5 — DISPLAY
            // =================================================

            displayResults(
                analysisData
            );


            // FIX (Bug 2): clear the PDF input now that it has
            // been used, so a later click on the main Analyze
            // button re-analyzes edited text instead of
            // silently re-running PDF extraction.
            documentInput.value = "";


        } catch (error) {

            console.error(
                "PDF ERROR:",
                error
            );

            showError(
                getErrorMessage(
                    error,
                    "Unable to analyze PDF."
                )
            );

        } finally {

            setLoading(false);
        }
    }


    // =====================================================
    // EXTRACT TEXT FROM BACKEND RESPONSE
    // =====================================================

    function getExtractedText(data) {

        if (!data) {
            return "";
        }


        const possibleValues = [

            data.extracted_text,

            data.extractedText,

            data.text,

            data.content,

            data.ocr_text,

            data.ocrText
        ];


        for (const value of possibleValues) {

            if (
                typeof value === "string" &&
                value.trim()
            ) {

                return value;
            }
        }


        return "";
    }


    // =====================================================
    // COMMON TEXT ANALYSIS
    // =====================================================

    async function analyzeExtractedText(text) {

        if (!text || !text.trim()) {

            throw new Error(
                "No text is available for trust analysis."
            );
        }


        const response =
            await fetchWithTimeout(
                `${API_BASE}/analyze`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        input_text:
                            text,

                        input_type:
                            "text"
                    })
                }
            );


        const data =
            await readResponse(response);


        console.log(
            "TRUST ANALYSIS RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                getServerError(
                    data,
                    `Trust analysis failed. HTTP ${response.status}`
                )
            );
        }


        return data;
    }


    // =====================================================
    // FETCH WITH TIMEOUT
    // =====================================================

    async function fetchWithTimeout(
        url,
        options = {},
        timeout = 60000
    ) {

        const controller =
            new AbortController();

        const timeoutId =
            setTimeout(
                () => controller.abort(),
                timeout
            );


        try {

            return await fetch(
                url,
                {
                    ...options,
                    signal: controller.signal
                }
            );

        } finally {

            clearTimeout(timeoutId);
        }
    }


    // =====================================================
    // SAFE RESPONSE READER
    // =====================================================

    async function readResponse(response) {

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType
                .toLowerCase()
                .includes("application/json")
        ) {

            try {

                return await response.json();

            } catch {

                return {
                    detail:
                        `Invalid JSON response. HTTP ${response.status}`
                };
            }
        }


        const text =
            await response.text();


        return {
            detail:
                text ||
                `Server returned HTTP ${response.status}`
        };
    }


    // =====================================================
    // SERVER ERROR
    // =====================================================

    function getServerError(
        data,
        fallback
    ) {

        if (!data) {
            return fallback;
        }


        if (
            typeof data.detail === "string" &&
            data.detail.trim()
        ) {

            return data.detail;
        }


        if (
            typeof data.message === "string" &&
            data.message.trim()
        ) {

            return data.message;
        }


        if (
            typeof data.error === "string" &&
            data.error.trim()
        ) {

            return data.error;
        }


        if (Array.isArray(data.detail)) {

            return data.detail
                .map(item => {

                    if (
                        item &&
                        typeof item.msg === "string"
                    ) {
                        return item.msg;
                    }

                    return String(item);
                })
                .join(", ");
        }


        return fallback;
    }


    // =====================================================
    // USER ERROR MESSAGE
    // =====================================================

    function getErrorMessage(
        error,
        fallback
    ) {

        if (!error) {
            return fallback;
        }


        if (
            error.name === "AbortError"
        ) {

            return (
                "The server took too long to respond. " +
                "Please try again."
            );
        }


        const message =
            String(
                error.message || ""
            );


        if (
            message
                .toLowerCase()
                .includes("failed to fetch")
        ) {

            return (
                "Cannot connect to TrustLens backend. " +
                "Make sure the Render server is running and CORS is enabled."
            );
        }


        if (
            message
                .toLowerCase()
                .includes("networkerror")
        ) {

            return (
                "Network error. Please check your internet connection and backend."
            );
        }


        return message || fallback;
    }


    // =====================================================
    // DISPLAY RESULTS
    // =====================================================

    function displayResults(data) {

        if (!resultsSection) {

            console.error(
                "resultsSection not found in HTML."
            );

            return;
        }


        if (!data || typeof data !== "object") {

            showError(
                "Backend returned an invalid analysis result."
            );

            return;
        }


        resultsSection.classList.remove(
            "hidden"
        );


        // =================================================
        // SCORE
        // =================================================

        const score =
            getScore(data);


        animateScore(score);


        // =================================================
        // RISK LEVEL
        // =================================================

        const level =
            getRiskLevel(
                data,
                score
            );


        if (riskBadge) {

            riskBadge.textContent =
                level.toUpperCase();


            riskBadge.classList.remove(
                "risk-low",
                "risk-medium",
                "risk-high"
            );


            if (
                level === "low" ||
                level === "medium" ||
                level === "high"
            ) {

                riskBadge.classList.add(
                    `risk-${level}`
                );
            }
        }


        // =================================================
        // TITLE
        // =================================================

        if (resultTitle) {

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
        }


        // =================================================
        // SUMMARY
        // =================================================

        if (summary) {

            summary.textContent =
                getStringValue(
                    data.summary,
                    "Analysis completed successfully."
                );
        }


        // =================================================
        // SIGNALS
        // =================================================

        const signals =
            getArray(
                data.risk_signals ||
                data.riskSignals ||
                data.signals
            );


        // =================================================
        // BEFORE ACTION
        // =================================================

        updateBeforeAction(
            level
        );


        // =================================================
        // SCORE REASONS
        // =================================================

        renderScoreReasons(
            signals
        );


        // =================================================
        // RISK SIGNALS
        // =================================================

        renderRiskSignals(
            signals
        );


        // =================================================
        // EVIDENCE GAPS
        // =================================================

        renderSimpleList(
            evidenceGaps,

            getArray(
                data.evidence_gaps ||
                data.evidenceGaps
            ),

            "No major evidence gaps were identified."
        );


        // =================================================
        // VERIFICATION STEPS
        // =================================================

        renderSimpleList(
            verificationSteps,

            getArray(
                data.verification_steps ||
                data.verificationSteps
            ),

            "No additional verification steps were provided."
        );


        // =================================================
        // ACTION PLAN
        // =================================================

        renderSimpleList(
            actionPlan,

            getArray(
                data.action_plan ||
                data.actionPlan
            ),

            "Continue to verify the information before taking action."
        );


        // =================================================
        // SCROLL TO RESULTS
        // =================================================

        setTimeout(
            () => {

                resultsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            150
        );
    }


    // =====================================================
    // SCORE VALUE
    // =====================================================

    function getScore(data) {

        const possibleScore =
            data.trust_score ??
            data.trustScore ??
            data.score;


        let score =
            Number(
                possibleScore
            );


        if (!Number.isFinite(score)) {
            score = 0;
        }


        return Math.max(
            0,
            Math.min(
                100,
                score
            )
        );
    }


    // =====================================================
    // RISK LEVEL
    // =====================================================

    function getRiskLevel(
        data,
        score
    ) {

        const rawLevel =
            data.risk_level ??
            data.riskLevel ??
            data.risk;


        if (rawLevel) {

            const level =
                String(rawLevel)
                    .toLowerCase()
                    .trim();


            if (
                level === "low" ||
                level === "medium" ||
                level === "high"
            ) {

                return level;
            }
        }


        // Fallback based on score
        if (score < 40) {
            return "high";
        }


        if (score < 70) {
            return "medium";
        }


        return "low";
    }


    // =====================================================
    // SCORE ANIMATION
    // =====================================================

    function animateScore(
        targetScore
    ) {

        if (!trustScore) {
            return;
        }


        let safeScore =
            Number(
                targetScore
            );


        if (!Number.isFinite(safeScore)) {
            safeScore = 0;
        }


        safeScore =
            Math.max(
                0,
                Math.min(
                    100,
                    safeScore
                )
            );


        const duration =
            1200;


        const start =
            performance.now();


        function update(now) {

            const progress =
                Math.min(
                    (now - start) /
                    duration,
                    1
                );


            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            const current =
                Math.round(
                    safeScore * eased
                );


            trustScore.textContent =
                current;


            if (scoreProgress) {

                const circumference =
                    314;


                const offset =
                    circumference -
                    (current / 100) *
                    circumference;


                scoreProgress.style.strokeDashoffset =
                    String(offset);


                if (safeScore < 40) {

                    scoreProgress.style.stroke =
                        "#ef4444";

                } else if (safeScore < 70) {

                    scoreProgress.style.stroke =
                        "#f59e0b";

                } else {

                    scoreProgress.style.stroke =
                        "#10b981";
                }
            }


            if (progress < 1) {

                requestAnimationFrame(
                    update
                );
            }
        }


        requestAnimationFrame(
            update
        );
    }


    // =====================================================
    // BEFORE ACTION
    // =====================================================

    function updateBeforeAction(
        level
    ) {

        if (!beforeAction) {
            return;
        }


        if (level === "high") {

            beforeAction.classList.remove(
                "hidden"
            );


            if (beforeTitle) {

                beforeTitle.textContent =
                    "Stop and verify this information.";
            }


            if (beforeText) {

                beforeText.textContent =
                    "Do not send money, credentials, or sensitive information until the claim has been independently verified.";
            }


            return;
        }


        if (level === "medium") {

            beforeAction.classList.remove(
                "hidden"
            );


            if (beforeTitle) {

                beforeTitle.textContent =
                    "Verify before proceeding.";
            }


            if (beforeText) {

                beforeText.textContent =
                    "Some risk indicators were detected. Check the evidence and verify the source before taking action.";
            }


            return;
        }


        beforeAction.classList.add(
            "hidden"
        );
    }


    // =====================================================
    // WHY THIS SCORE
    // =====================================================

    function renderScoreReasons(
        signals
    ) {

        if (!scoreReasons) {
            return;
        }


        scoreReasons.innerHTML = "";


        if (!signals.length) {

            scoreReasons.innerHTML = `
                <div class="result-item">
                    No significant observable risk signals were detected.
                </div>
            `;

            return;
        }


        const severityWeight = {

            high: 90,
            medium: 60,
            low: 30
        };


        signals.forEach(
            (signal, index) => {

                const safeSignal =
                    signal &&
                    typeof signal === "object"
                        ? signal
                        : {
                            title: String(signal)
                        };


                const severity =
                    String(
                        safeSignal.severity ||
                        "Low"
                    ).toLowerCase();


                const width =
                    severityWeight[severity] ||
                    30;


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "reason-row";


                row.style.animationDelay =
                    `${index * 100}ms`;


                row.innerHTML = `

                    <div class="reason-name">
                        ${escapeHTML(
                            safeSignal.title ||
                            "Risk Signal"
                        )}
                    </div>

                    <div class="reason-bar">

                        <div
                            class="reason-fill"
                            style="width:${width}%">
                        </div>

                    </div>

                    <div class="reason-severity">
                        ${escapeHTML(
                            safeSignal.severity ||
                            "Low"
                        )}
                    </div>
                `;


                scoreReasons.appendChild(
                    row
                );
            }
        );
    }


    // =====================================================
    // RISK SIGNALS
    // =====================================================

    function renderRiskSignals(
        signals
    ) {

        if (!riskSignals) {
            return;
        }


        riskSignals.innerHTML = "";


        if (!signals.length) {

            riskSignals.innerHTML = `
                <div class="result-item empty-item">
                    No major risk signals were detected.
                </div>
            `;

            return;
        }


        signals.forEach(
            (signal, index) => {

                const safeSignal =
                    signal &&
                    typeof signal === "object"
                        ? signal
                        : {
                            title: String(signal)
                        };


                const severity =
                    String(
                        safeSignal.severity ||
                        "Low"
                    ).toLowerCase();


                const validSeverity =
                    [
                        "high",
                        "medium",
                        "low"
                    ].includes(severity)
                        ? severity
                        : "low";


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "result-item signal-item";


                item.style.animationDelay =
                    `${index * 100}ms`;


                const wrapper =
                    document.createElement(
                        "div"
                    );


                const title =
                    document.createElement(
                        "div"
                    );


                title.className =
                    "signal-title";


                title.textContent =
                    safeSignal.title ||
                    "Risk signal detected";


                const explanation =
                    document.createElement(
                        "div"
                    );


                explanation.className =
                    "signal-explanation";


                explanation.textContent =
                    safeSignal.explanation ||
                    "Additional verification is recommended.";


                wrapper.appendChild(
                    title
                );


                wrapper.appendChild(
                    explanation
                );


                const badge =
                    document.createElement(
                        "span"
                    );


                badge.className =
                    `severity ${validSeverity}`;


                badge.textContent =
                    safeSignal.severity ||
                    "Low";


                item.appendChild(
                    wrapper
                );


                item.appendChild(
                    badge
                );


                riskSignals.appendChild(
                    item
                );
            }
        );
    }


    // =====================================================
    // SIMPLE LIST
    // =====================================================

    function renderSimpleList(
        container,
        items,
        emptyMessage
    ) {

        if (!container) {
            return;
        }


        container.innerHTML = "";


        if (!items.length) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "result-item empty-item";


            empty.textContent =
                emptyMessage;


            container.appendChild(
                empty
            );


            return;
        }


        items.forEach(
            (item, index) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "result-item";


                element.style.animationDelay =
                    `${index * 80}ms`;


                if (
                    item &&
                    typeof item === "object"
                ) {

                    element.textContent =
                        item.text ||
                        item.description ||
                        item.title ||
                        JSON.stringify(item);

                } else {

                    element.textContent =
                        String(item);
                }


                container.appendChild(
                    element
                );
            }
        );
    }


    // =====================================================
    // ARRAY NORMALIZER
    // =====================================================

    function getArray(value) {

        if (Array.isArray(value)) {
            return value;
        }


        if (
            typeof value === "string" &&
            value.trim()
        ) {

            return [value];
        }


        return [];
    }


    // =====================================================
    // STRING VALUE
    // =====================================================

    function getStringValue(
        value,
        fallback
    ) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {

            return value;
        }


        return fallback;
    }


    // =====================================================
    // LOADING
    // =====================================================

    function setLoading(
        isLoading
    ) {

        if (analyzeBtn) {

            analyzeBtn.disabled =
                isLoading;
        }


        if (analyzeDocumentBtn) {

            analyzeDocumentBtn.disabled =
                isLoading;
        }


        if (isLoading) {

            if (buttonText) {

                buttonText.textContent =
                    "Analyzing Trust Signals...";
            }


            if (buttonLoader) {

                buttonLoader.classList.remove(
                    "hidden"
                );
            }

        } else {

            if (buttonText) {

                buttonText.textContent =
                    "Analyze Trustworthiness";
            }


            if (buttonLoader) {

                buttonLoader.classList.add(
                    "hidden"
                );
            }
        }
    }


    // =====================================================
    // ERROR
    // =====================================================

    function showError(
        message
    ) {

        console.error(
            "TrustLens:",
            message
        );


        if (!errorMessage) {
            return;
        }


        errorMessage.textContent =
            String(message);


        errorMessage.classList.remove(
            "hidden"
        );
    }


    function hideError() {

        if (!errorMessage) {
            return;
        }


        errorMessage.classList.add(
            "hidden"
        );


        errorMessage.textContent =
            "";
    }


    // =====================================================
    // NEW ANALYSIS
    // =====================================================

    if (newAnalysisBtn) {

        newAnalysisBtn.addEventListener(
            "click",
            (event) => {

                event.preventDefault();


                if (resultsSection) {

                    resultsSection.classList.add(
                        "hidden"
                    );
                }


                if (inputText) {

                    inputText.value = "";
                }


                if (urlInput) {

                    urlInput.value = "";
                }


                if (characterCount) {

                    characterCount.textContent =
                        "0 characters";
                }


                if (screenshotInput) {

                    screenshotInput.value = "";
                }


                if (documentInput) {

                    documentInput.value = "";
                }


                hideImagePreview();


                hideError();


                if (inputType) {

                    inputType.value =
                        inputType.options &&
                        inputType.options.length
                            ? inputType.options[0].value
                            : inputType.value;
                }


                updateInputMode();


                if (inputText) {

                    inputText.focus();
                }


                window.scrollTo({

                    top: 0,

                    behavior: "smooth"
                });
            }
        );
    }


    // =====================================================
    // PDF BUTTON
    // =====================================================

    if (analyzeDocumentBtn) {

        analyzeDocumentBtn.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                if (
                    analyzeDocumentBtn.disabled
                ) {
                    return;
                }

                analyzeDocument();
            }
        );
    }


    // =====================================================
    // HTML ESCAPING
    // =====================================================

    function escapeHTML(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(value);


        return div.innerHTML;
    }


    // =====================================================
    // GLOBAL ERROR DEBUGGING
    // =====================================================

    window.addEventListener(
        "error",
        (event) => {

            console.error(
                "Frontend error:",
                event.error || event.message
            );
        }
    );


    window.addEventListener(
        "unhandledrejection",
        (event) => {

            console.error(
                "Unhandled promise rejection:",
                event.reason
            );
        }
    );

});