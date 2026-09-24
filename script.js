const API_URL = "https://chatbot-production-a027.up.railway.app/ask";

// ============================================================
// ELEMENTS
// ============================================================

const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");

// ============================================================
// STATE
// ============================================================

let isLoading = false;

// ============================================================
// MARKED CONFIGURATION
// ============================================================

if (typeof marked !== "undefined") {
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

// ============================================================
// ADD USER MESSAGE
// ============================================================

function addUserMessage(message) {

    const wrapper = document.createElement("div");

    wrapper.className = "message user-message";

    wrapper.innerHTML = `
        <div class="message-avatar">
            You
        </div>

        <div class="message-content">
            ${escapeHtml(message)}
        </div>
    `;

    chatBox.appendChild(wrapper);

    scrollToBottom();
}

// ============================================================
// ADD BOT MESSAGE
// ============================================================

function addBotMessage(
    answer,
    sources = [],
    responseTime = null
) {

    const wrapper = document.createElement("div");

    wrapper.className = "message bot-message";

    // --------------------------------------------------------
    // SOURCES
    // --------------------------------------------------------

    let sourcesHtml = "";

    if (
        Array.isArray(sources) &&
        sources.length > 0
    ) {

        sourcesHtml = `
            <div class="sources">

                <div class="sources-title">
                    Sources
                </div>

                ${sources.map(source => `
                    <a
                        href="${escapeAttribute(source)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${escapeHtml(source)}
                    </a>
                `).join("")}

            </div>
        `;
    }

    // --------------------------------------------------------
    // RESPONSE TIME
    // --------------------------------------------------------

    let timingHtml = "";

    if (responseTime !== null) {

        timingHtml = `
            <div class="response-time">
                ${responseTime.toFixed(2)}s
            </div>
        `;
    }

    // --------------------------------------------------------
    // BOT MESSAGE
    // --------------------------------------------------------

    wrapper.innerHTML = `
        <div class="message-avatar">
            AI
        </div>

        <div class="message-content">

            <div class="bot-answer">
                ${formatAnswer(answer)}
            </div>

            ${timingHtml}

            ${sourcesHtml}

        </div>
    `;

    chatBox.appendChild(wrapper);

    scrollToBottom();
}

// ============================================================
// TYPING INDICATOR
// ============================================================

function showTyping() {

    removeTyping();

    const wrapper = document.createElement("div");

    wrapper.id = "typingIndicator";

    wrapper.className = "message bot-message";

    wrapper.innerHTML = `
        <div class="message-avatar">
            AI
        </div>

        <div class="message-content">

            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>

        </div>
    `;

    chatBox.appendChild(wrapper);

    scrollToBottom();
}

// ============================================================
// REMOVE TYPING INDICATOR
// ============================================================

function removeTyping() {

    const typing =
        document.getElementById("typingIndicator");

    if (typing) {
        typing.remove();
    }
}

// ============================================================
// SEND QUESTION
// ============================================================

async function sendQuestion(question) {

    question = question.trim();

    if (!question) {
        return;
    }

    if (isLoading) {
        return;
    }

    isLoading = true;

    setLoadingState(true);

    // --------------------------------------------------------
    // SHOW USER MESSAGE
    // --------------------------------------------------------

    addUserMessage(question);

    questionInput.value = "";

    showTyping();

    const startTime = performance.now();

    try {

        // ----------------------------------------------------
        // API REQUEST
        // ----------------------------------------------------

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify({
                    question: question
                })
            }
        );

        // ----------------------------------------------------
        // READ RESPONSE
        // ----------------------------------------------------

        const data = await response.json();

        // ----------------------------------------------------
        // CHECK ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Server error"
            );
        }

        // ----------------------------------------------------
        // CALCULATE FRONTEND TIME
        // ----------------------------------------------------

        const endTime = performance.now();

        const frontendTime =
            (
                endTime -
                startTime
            ) / 1000;

        // ----------------------------------------------------
        // REMOVE TYPING
        // ----------------------------------------------------

        removeTyping();

        // ----------------------------------------------------
        // BACKEND TIME
        // ----------------------------------------------------

        const backendTime =
            data.timing &&
            data.timing.total_seconds
                ? data.timing.total_seconds
                : frontendTime;

        // ----------------------------------------------------
        // SHOW BOT ANSWER
        // ----------------------------------------------------

        addBotMessage(
            data.answer ||
            "No answer received.",

            data.sources || [],

            backendTime
        );

    } catch (error) {

        console.error(
            "Chatbot error:",
            error
        );

        removeTyping();

        addBotMessage(
            "Sorry, I couldn't connect to the chatbot server. Please try again."
        );

    } finally {

        isLoading = false;

        setLoadingState(false);

        questionInput.focus();
    }
}

// ============================================================
// FORM SUBMIT
// ============================================================

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            sendQuestion(
                questionInput.value
            );
        }
    );
}

// ============================================================
// ENTER KEY
// ============================================================

if (questionInput) {

    questionInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendQuestion(
                    questionInput.value
                );
            }
        }
    );
}

// ============================================================
// BUTTON STATE
// ============================================================

function setLoadingState(loading) {

    if (!sendBtn) {
        return;
    }

    sendBtn.disabled = loading;

    if (loading) {

        sendBtn.dataset.oldText =
            sendBtn.textContent;

        sendBtn.textContent =
            "Sending...";

    } else {

        sendBtn.textContent =
            sendBtn.dataset.oldText ||
            "Send";
    }
}

// ============================================================
// FORMAT AI ANSWER
// ============================================================

function formatAnswer(text) {

    if (!text) {
        return "";
    }

    // --------------------------------------------------------
    // Convert escaped Markdown back to normal Markdown
    // --------------------------------------------------------
    //
    // Example:
    //
    // \*\*Battery\*\*
    //
    // becomes:
    //
    // **Battery**
    //
    // --------------------------------------------------------

    text = text.replace(
        /\\([\\`*_{}\[\]()#+\-.!>])/g,
        "$1"
    );

    // --------------------------------------------------------
    // If marked.js is available, render Markdown
    // --------------------------------------------------------

    if (typeof marked !== "undefined") {

        return marked.parse(text);
    }

    // --------------------------------------------------------
    // Fallback if marked.js failed to load
    // --------------------------------------------------------

    return escapeHtml(text)
        .replace(/\n/g, "<br>");
}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// ============================================================
// ATTRIBUTE ESCAPE
// ============================================================

function escapeAttribute(text) {

    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}

// ============================================================
// SCROLL TO BOTTOM
// ============================================================

function scrollToBottom() {

    if (!chatBox) {
        return;
    }

    chatBox.scrollTop =
        chatBox.scrollHeight;
}
