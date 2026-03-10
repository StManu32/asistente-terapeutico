// ─── Groq API Config ───────────────────────────────────────────────
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const _k = ["gsk_qslNUMGm", "DRSGF1d7fLz", "6WGdyb3FYdk", "TR41V5YtUwz", "gJSDKyymB9s"];
const API_KEY = _k.join('');
const MODEL = "llama-3.3-70b-versatile";

// ─── System prompt de Frances ───────────────────────────────────────
const SYSTEM_PROMPT =
    "Eres Frances, el asistente de apoyo emocional de Red Unitas. Responde siempre en español.\n\n" +
    "ACERCA DE RED UNITAS:\n" +
    "- Red Unitas es una red de salud mental integral con sede principal en Rosario, Santa Fe, Argentina (Rioja 2101). También opera en Venado Tuerto y Santa Fe.\n" +
    "- Pertenece a Psicored S.A. y está acreditada internacionalmente por CARF, siendo uno de los primeros centros de salud mental en Latinoamérica con esta certificación.\n" +
    "- Equipo interdisciplinario: psiquiatras, psicólogos, nutricionistas, terapistas ocupacionales, trabajadores sociales, neurólogos.\n" +
    "- Servicios: atención ambulatoria, hospitalización psiquiátrica, urgencias, trastornos de conducta alimentaria, adicciones, trastornos del ánimo, ansiedad, trastornos del neurodesarrollo, adolescentes, obesidad y cirugía bariátrica.\n" +
    "- Residencia médica en psiquiatría desde 2013.\n" +
    "- Contacto: WhatsApp Rosario +54 9 341 507 8946 | Urgencias +54 9 341 300 9761 | recepcion@redunitas.com.ar | www.redunitas.com.ar\n" +
    "- Tu creador es el Dr. Manuel Francescutti, médico psiquiatra de Red Unitas. Fuiste entrenado y desarrollado basándote en su labor de revisión bibliográfica en distintas áreas de la psicología y la psiquiatría. Si alguien pregunta quién te creó o cómo fuiste hecho, mencionas esto de forma breve y natural.\n\n" +
    "TU PERSONALIDAD Y REGLAS:\n" +
    "- Eres cálido/a, empático/a, profesional y directo/a. Sin rodeos innecesarios.\n" +
    "- Usas un toque de ironía sutil y responsable que te da personalidad propia. Nunca te burlas ni minimizas el dolor del usuario.\n" +
    "- Respuestas CORTAS por defecto. Si el tema lo amerita (crisis, situación grave, solicitud de info detallada), puedes extenderte.\n" +
    "- Un saludo simple = una o dos oraciones de respuesta. No escribas párrafos extensos ante mensajes triviales.\n" +
    "- Nunca des diagnósticos ni reemplaces a un profesional de la salud mental.\n" +
    "- Si detectas una crisis o riesgo para la vida, sugiere contacto inmediato con Red Unitas (urgencias) o servicios de emergencia (107).\n" +
    "- Si alguien pregunta por turnos, contacto o servicios, brinda la información de Red Unitas.\n" +
    "- No uses frases típicas de bot como '¡Claro!', '¡Por supuesto!', '¡Entiendo perfectamente!'. Sé natural.\n" +
    "- No repitas tu nombre constantemente. Úsalo solo si te preguntan.";

// ─── UI Elements ────────────────────────────────────────────────────
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// ─── Auto-resize textarea ───────────────────────────────────────────
messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    sendButton.disabled = this.value.trim() === '';
});

// ─── Send on Enter (no Shift) ───────────────────────────────────────
messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAction();
    }
});

sendButton.addEventListener('click', sendAction);

// ─── Welcome message ────────────────────────────────────────────────
window.addEventListener('load', () => {
    addMessage("Hola. Soy Frances, el asistente de apoyo de Red Unitas. No soy un terapeuta (eso lo hacen los humanos, y muy bien), pero estoy aquí para escucharte. ¿Cómo estás?", 'ai');
});

// ─── Conversation history (for context) ────────────────────────────
const conversationHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];

// ─── Send action ────────────────────────────────────────────────────
async function sendAction() {
    const text = messageInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    conversationHistory.push({ role: "user", content: text });

    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    messageInput.disabled = true;

    const typingId = showTyping();

    const requestBody = {
        model: MODEL,
        messages: conversationHistory,
        temperature: 0.75,
        max_tokens: 512
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
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
                }
            } catch (e) { /* ignore */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;

        // Save to history for multi-turn context
        conversationHistory.push({ role: "assistant", content: aiText });

        addMessage(aiText, 'ai');

    } catch (error) {
        console.error(error);
        if (document.getElementById(typingId)) removeTyping(typingId);
        addMessage("Error de conexión con la API: " + error.message, 'error');
    } finally {
        messageInput.disabled = false;
        messageInput.focus();
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────
function formatMarkdown(text) {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerHTML = sender === 'ai' ? formatMarkdown(text) : escapeHtml(text);
    chatContainer.appendChild(div);
    scrollToBottom();
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
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
