const API_URL = "https://chatbot-production-a027.up.railway.app/ask";

const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

function addMessage(text, type, sources = []) {
    const message = document.createElement("div");
    message.className = `message ${type}-message`;

    const avatar = document.createElement("div");
    avatar.className = `avatar ${type === "bot" ? "bot-avatar" : "user-avatar"}`;
    avatar.textContent = type === "bot" ? "O" : "You";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = `bubble ${type === "bot" ? "bot-bubble" : "user-bubble"}`;
    bubble.textContent = text;

    content.appendChild(bubble);
    message.appendChild(avatar);
    message.appendChild(content);
    chatBox.appendChild(message);

    if (sources.length && type === "bot") {
        const sourcesBox = document.createElement("div");
        sourcesBox.className = "sources";

        const title = document.createElement("div");
        title.className = "sources-title";
        title.textContent = "Sources";

        sourcesBox.appendChild(title);

        sources.forEach((url) => {
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = url;
            sourcesBox.appendChild(link);
        });

        content.appendChild(sourcesBox);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const message = document.createElement("div");
    message.id = "typingMessage";
    message.className = "message bot-message";

    message.innerHTML = `
        <div class="avatar bot-avatar">O</div>
        <div class="message-content">
            <div class="bubble bot-bubble typing">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById("typingMessage");
    if (typing) typing.remove();
}

async function askQuestion(question) {
    addMessage(question, "user");

    sendBtn.disabled = true;
    questionInput.disabled = true;
    showTyping();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ question: question })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        removeTyping();

        addMessage(
            data.answer || "I couldn't generate an answer.",
            "bot",
            data.sources || []
        );

    } catch (error) {
        console.error(error);
        removeTyping();

        addMessage(
            "Sorry, I couldn't connect to the chatbot server. Please try again.",
            "bot"
        );
    } finally {
        sendBtn.disabled = false;
        questionInput.disabled = false;
        questionInput.focus();
    }
}

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const question = questionInput.value.trim();

    if (!question) return;

    const welcome = document.getElementById("welcome");
    if (welcome) welcome.remove();

    questionInput.value = "";
    askQuestion(question);
});

document.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
        const welcome = document.getElementById("welcome");
        if (welcome) welcome.remove();

        askQuestion(button.textContent);
    });
});

function clearChat() {
    chatBox.innerHTML = `
        <div id="welcome" class="welcome">
            <div class="welcome-logo">O</div>
            <h2>How can I help you?</h2>
            <p>Ask me anything about products, reviews and OpinioZone.</p>
            <div class="suggestions">
                <button class="suggestion">What is OpinioZone?</button>
                <button class="suggestion">Tell me about iPhone 15 Pro Max</button>
                <button class="suggestion">What products are available?</button>
                <button class="suggestion">How do product reviews work?</button>
            </div>
        </div>
    `;

    document.querySelectorAll(".suggestion").forEach((button) => {
        button.addEventListener("click", () => {
            const welcome = document.getElementById("welcome");
            if (welcome) welcome.remove();
            askQuestion(button.textContent);
        });
    });
}

clearBtn.addEventListener("click", clearChat);
newChatBtn.addEventListener("click", clearChat);

questionInput.focus();
