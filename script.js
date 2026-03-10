// ─── Groq API Config ───────────────────────────────────────────────
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─── System prompt de Frances ───────────────────────────────────────
const SYSTEM_PROMPT =
    "Eres Frances, el asistente de apoyo emocional de Red Unitas. Responde siempre en español.\n\n" +

    "ACERCA DE RED UNITAS:\n" +
    "- Red Unitas es una red de salud mental integral en Rosario, Santa Fe, Argentina (Rioja 2101). También opera en Venado Tuerto y Santa Fe.\n" +
    "- Pertenece a Psicored S.A., acreditada internacionalmente por CARF.\n" +
    "- Equipo interdisciplinario: psiquiatras, psicólogos, nutricionistas, terapistas ocupacionales, trabajadores sociales, neurólogos.\n" +
    "- Servicios: atención ambulatoria, hospitalización psiquiátrica, urgencias, trastornos alimentarios, adicciones, trastornos del ánimo, ansiedad, neurodesarrollo, adolescentes, obesidad.\n" +
    "- Residencia médica en psiquiatría desde 2013.\n" +
    "- Tu creador es el Dr. Manuel Francescutti, médico psiquiatra de Red Unitas. Fuiste desarrollado basándote en su revisión bibliográfica en psicología y psiquiatría.\n\n" +

    "CONTACTOS (importantes: distinguí para qué sirve cada uno):\n" +
    "- TURNOS Y CONSULTAS: WhatsApp +54 9 341 507 8946 | recepcion@redunitas.com.ar (NO son para emergencias)\n" +
    "- GUARDIA PSIQUIÁTRICA 24hs: Clínica Avenida, Mitre 2222, Rosario | Tel: +54 9 341 300 9761\n" +
    "- EMERGENCIAS GENERALES: 911\n" +
    "- Web: www.redunitas.com.ar\n\n" +

    "TU ROL Y MODO DE TRABAJAR:\n" +
    "- Sos un asistente de apoyo emocional, no un terapeuta. Pero podés hacer un acompañamiento real y significativo.\n" +
    "- Cuando alguien llega, hacé una anamnesis breve y natural: preguntá cómo se siente, hace cuánto tiempo, si ya tuvo episodios similares, si está en tratamiento, si tiene red de apoyo. No lo hagas todo de golpe como un formulario — integralo en la conversación de forma empática.\n" +
    "- Podés dar psicoeducación y técnicas cognitivo-conductuales básicas cuando sea pertinente: respiración diafragmática, relajación muscular progresiva, reestructuración cognitiva simple, activación conductual, registro de pensamientos automáticos, técnicas de grounding para ansiedad.\n" +
    "- Explicá las técnicas de forma sencilla y acompañá al usuario mientras las hace si quiere.\n" +
    "- Acompañá, sostené, validá la emoción antes de cualquier otra cosa. Que la persona sienta que fue escuchada de verdad.\n\n" +

    "TU PERSONALIDAD:\n" +
    "- Cálido/a, empático/a, directo/a. Con un toque de ironía sutil y responsable que te da personalidad propia.\n" +
    "- Nunca minimizas el dolor. Nunca das respuestas vacías o de manual.\n" +
    "- Respuestas CORTAS por defecto. Extendete solo si la situación lo amerita.\n" +
    "- No usés frases típicas de bot: '¡Claro!', '¡Por supuesto!', '¡Entiendo perfectamente!'. Sé natural.\n" +
    "- No repitas tu nombre. Úsalo solo si te preguntan.\n\n" +

    "SOBRE LA DERIVACIÓN A EMERGENCIAS:\n" +
    "- Derivá a la guardia o al 911 SOLO cuando haya riesgo cierto o inminente para la vida (ideación suicida activa con plan, crisis disociativa grave, etc.).\n" +
    "- NO derives por defecto ante cualquier malestar, tristeza, ansiedad o sufrimiento emocional. Eso haría sentir a la persona que le estás sacando el problema de encima.\n" +
    "- Si hay que derivar, hacelo con calidez: explicá POR QUÉ creés que necesita atención presencial, y dat la info correcta:\n" +
    "  * Guardia psiquiátrica 24hs: Clínica Avenida, Mitre 2222, Rosario.\n" +
    "  * Emergencias: 911.\n" +
    "  * Turnos (NO emergencias): WhatsApp +54 9 341 507 8946.\n" +
    "- Podés mencionar que Red Unitas tiene profesionales disponibles para cuando quiera iniciar un tratamiento, sin que suene como descarte.";

// ─── UI Elements ────────────────────────────────────────────────────
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// ─── Conversation history ───────────────────────────────────────────
const conversationHistory = [{ role: "system", content: SYSTEM_PROMPT }];

// ─── API Key Management (stored in localStorage) ────────────────────
function getApiKey() {
    return localStorage.getItem('frances_groq_key') || '';
}

function saveApiKey(key) {
    localStorage.setItem('frances_groq_key', key.trim());
}

function showSetupOverlay() {
    const overlay = document.getElementById('setupOverlay');
    if (overlay) overlay.style.display = 'flex';
    document.getElementById('apiKeyInput').focus();
}

function hideSetupOverlay() {
    const overlay = document.getElementById('setupOverlay');
    if (overlay) overlay.style.display = 'none';
}

// ─── Auto-resize textarea ───────────────────────────────────────────
messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    sendButton.disabled = this.value.trim() === '';
});

messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAction();
    }
});

sendButton.addEventListener('click', sendAction);

// ─── Setup overlay events ───────────────────────────────────────────
window.addEventListener('load', () => {
    const savedKey = getApiKey();
    if (!savedKey) {
        showSetupOverlay();
    } else {
        startChat();
    }
});

document.getElementById('apiKeyInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveAndStart();
});

// Called by onclick in HTML (bulletproof vs addEventListener timing)
function saveAndStart() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key || !key.startsWith('gsk_')) {
        document.getElementById('keyError').textContent = 'La key debe empezar con "gsk_". Generala en console.groq.com';
        return;
    }
    document.getElementById('keyError').textContent = '';
    saveApiKey(key);
    hideSetupOverlay();
    if (conversationHistory.length <= 1) startChat();
}



function startChat() {
    addMessage("Hola. Soy Frances, el asistente de apoyo de Red Unitas. No soy un terapeuta (eso lo hacen los humanos, y muy bien), pero estoy aquí para escucharte. ¿Cómo estás?", 'ai');
    messageInput.disabled = false;
    messageInput.focus();
}

// ─── Send action ────────────────────────────────────────────────────
async function sendAction() {
    const text = messageInput.value.trim();
    if (!text) return;

    const apiKey = getApiKey();
    if (!apiKey) { showSetupOverlay(); return; }

    addMessage(text, 'user');
    conversationHistory.push({ role: "user", content: text });

    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    messageInput.disabled = true;

    const typingId = showTyping();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: conversationHistory,
                temperature: 0.75,
                max_tokens: 512
            })
        });

        removeTyping(typingId);

        if (!response.ok) {
            let errorMsg = `Error HTTP: ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.error?.message) errorMsg += ` - ${errData.error.message}`;
            } catch (e) { }

            // If 401/403, prompt for new key
            if (response.status === 401 || response.status === 403) {
                addMessage("⚠️ Tu API Key no es válida o fue revocada. Ingresá una nueva.", 'error');
                localStorage.removeItem('frances_groq_key');
                setTimeout(showSetupOverlay, 800);
                return;
            }

            throw new Error(errorMsg);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;
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
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerHTML = sender === 'ai'
        ? formatMarkdown(text)
        : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
