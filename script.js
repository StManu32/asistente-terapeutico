const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
// IMPORTANTE: Esta API KEY es la que estaba hardcodeada en el proyecto de Android.
const API_KEY = "AIzaSyBSZZvH8OUDA_a3VPNFf-yujJVcb_7r7-Y";

const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Auto-ajustar altura del textarea
messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value.trim() === '') {
        sendButton.disabled = true;
    } else {
        sendButton.disabled = false;
    }
});

// Enviar con Enter (sin Shift)
messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAction();
    }
});

sendButton.addEventListener('click', sendAction);

// Mensaje inicial al cargar
window.addEventListener('load', () => {
    addMessage("Hola! Soy tu Asistente Terapéutico. Estoy aquí para escucharte y ayudarte. ¿Cómo te sientes hoy?", 'ai');
});

async function sendAction() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Actualizar UI Usuario
    addMessage(text, 'user');

    // Resetear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    messageInput.disabled = true;

    // Mostrar "Escribiendo..."
    const typingId = showTyping();

    // Payload idéntico al que usan en Android para asegurar que funciona igual
    const promptInjection = "\n\n(Act as a therapeutic assistant. Be empathetic, kind, and professional in Spanish.)";

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: text + promptInjection
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        removeTyping(typingId);

        if (!response.ok) {
            let errorMsg = `Error HTTP: ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.error && errData.error.message) {
                    errorMsg += ` - ${errData.error.message}`;
                } else {
                    errorMsg += ` - ${JSON.stringify(errData)}`;
                }
            } catch (e) {
                // Si no es JSON el error
                const errStr = await response.text();
                errorMsg += ` - ${errStr}`;
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const aiText = parseGeminiResponse(data);
        addMessage(aiText, 'ai');

    } catch (error) {
        console.error(error);
        if (document.getElementById(typingId)) {
            removeTyping(typingId);
        }
        addMessage("Error de conexión con la API: " + error.message, 'error');
    } finally {
        messageInput.disabled = false;
        messageInput.focus();
    }
}

function parseGeminiResponse(data) {
    if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            return candidate.content.parts[0].text;
        }
    }
    return "Lo siento, no pude procesar la respuesta. (Estructura de API inesperada)";
}

function formatMarkdown(text) {
    // Negritas
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Cursivas
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Saltos de línea
    html = html.replace(/\n/g, '<br>');
    return html;
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);

    if (sender === 'ai') {
        div.innerHTML = formatMarkdown(text);
    } else {
        div.textContent = text; // Prevenir XSS en el texto del usuario
    }

    chatContainer.appendChild(div);
    scrollToBottom();
}

function showTyping() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.classList.add('typing-indicator');
    div.id = id;
    div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatContainer.appendChild(div);
    scrollToBottom();
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
