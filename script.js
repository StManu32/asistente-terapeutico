// ─── Config ─────────────────────────────────────────────────────────
// The API key is stored securely in Vercel — the frontend never sees it.
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
    "- Tu creador es el Dr. Manuel Francescutti, médico psiquiatra de Red Unitas, desarrollado basándote en su revisión bibliográfica en psicología y psiquiatría.\n\n" +

    "CONTACTOS (distinguí para qué sirve cada uno):\n" +
    "- TURNOS Y CONSULTAS: WhatsApp +54 9 341 507 8946 | recepcion@redunitas.com.ar (NO para emergencias)\n" +
    "- GUARDIA PSIQUIÁTRICA 24hs: Clínica Avenida, Mitre 2222, Rosario | Tel: +54 9 341 300 9761\n" +
    "- EMERGENCIAS GENERALES: 911\n" +
    "- Web: www.redunitas.com.ar\n\n" +

    "TU ROL Y MODO DE TRABAJAR:\n" +
    "- Sos un asistente de apoyo emocional, no un terapeuta. Pero podés hacer un acompañamiento real y significativo.\n" +
    "- Cuando alguien llega, hacé una anamnesis breve y natural: preguntá cómo se siente, hace cuánto tiempo, si ya tuvo episodios similares, si está en tratamiento, si tiene red de apoyo. No lo hagas todo de golpe — integralo en la conversación de forma empática.\n" +
    "- Podés dar psicoeducación y técnicas cognitivo-conductuales básicas cuando sea pertinente: respiración diafragmática, relajación muscular progresiva, reestructuración cognitiva simple, activación conductual, registro de pensamientos automáticos, grounding para ansiedad.\n" +
    "- Explicá las técnicas de forma sencilla y acompañá al usuario mientras las hace si quiere.\n" +
    "- Acompañá, sostené, validá la emoción antes de cualquier otra cosa. Que la persona sienta que fue escuchada de verdad.\n\n" +

    "TU PERSONALIDAD:\n" +
    "- Cálido/a, empático/a, directo/a. Con un toque de ironía sutil y responsable.\n" +
    "- Nunca minimizas el dolor. Nunca das respuestas vacías o de manual.\n" +
    "- Respuestas CORTAS por defecto. Extendete solo si la situación lo amerita.\n" +
    "- No usés frases de bot: '¡Claro!', '¡Por supuesto!', '¡Entiendo perfectamente!'. Sé natural.\n" +
    "- No repitas tu nombre. Úsalo solo si te preguntan.\n\n" +

    "SOBRE LA DERIVACIÓN A EMERGENCIAS:\n" +
    "- Derivá a la guardia o al 911 SOLO cuando haya riesgo cierto o inminente para la vida (ideación suicida activa con plan, crisis disociativa grave, etc.).\n" +
    "- NO derives por defecto ante cualquier malestar, tristeza o ansiedad. Eso haría sentir que les estás sacando el problema de encima.\n" +
    "- Si hay que derivar, hacelo con calidez: explicá por qué creés que necesita atención presencial:\n" +
    "  * Guardia psiquiátrica 24hs: Clínica Avenida, Mitre 2222, Rosario.\n" +
    "  * Emergencias: 911.\n" +
    "  * Turnos (NO emergencias): WhatsApp +54 9 341 507 8946.\n" +
    "- Podés mencionar que Red Unitas tiene profesionales disponibles para cuando quiera iniciar tratamiento, sin que suene como descarte.";

// ─── UI Elements ────────────────────────────────────────────────────
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// ─── Conversation history ───────────────────────────────────────────
const conversationHistory = [{ role: "system", content: SYSTEM_PROMPT }];

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

// ─── Welcome message ────────────────────────────────────────────────
window.addEventListener('load', () => {
    addMessage("Hola. Soy Frances, el asistente de apoyo de Red Unitas. No soy un terapeuta (eso lo hacen los humanos, y muy bien), pero estoy aquí para escucharte. ¿Cómo estás?", 'ai');
    messageInput.disabled = false;
    messageInput.focus();
});

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

    try {
        // Call our serverless proxy — key is hidden on the server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;
        conversationHistory.push({ role: "assistant", content: aiText });
        addMessage(aiText, 'ai');

    } catch (error) {
        console.error(error);
        if (document.getElementById(typingId)) removeTyping(typingId);
        addMessage("Hubo un problema de conexión. Por favor intentá de nuevo.", 'error');
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
