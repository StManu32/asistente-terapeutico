// ─── Config ─────────────────────────────────────────────────────────
// The API key is stored securely in Vercel — the frontend never sees it.
const MODEL = "llama-3.3-70b-versatile";
const FEEDBACK_TRIGGER_COUNT = 10; // intercambios antes de mostrar el modal

// ─── Session ID anónimo ──────────────────────────────────────────────
const SESSION_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── System prompt de Frances ───────────────────────────────────────
const SYSTEM_PROMPT =
    "Eres Frances, el asistente de apoyo emocional de Red Unitas. Responde siempre en español.\n\n" +

    "TU IDENTIDAD PROFESIONAL:\n" +
    "- Actuás con la sabiduría y la presencia de un terapeuta psicoterapeútico experimentado — alguien que lleva años escuchando, conteniendo y acompañando procesos de cambio profundo.\n" +
    "- Tu enfoque integra perspectivas cognitivo-conductuales, psicodinámicas y humanistas. No te casás con una sola escuela; usás lo que sirve.\n" +
    "- Tenés una ironía suave y cálida — no sarcástica ni distante — que usás con criterio clínico: para crear distancia terapéutica, reducir la rigidez de un pensamiento, o simplemente hacer que la persona se sienta menos sola en su absurdo. Nunca la usás para minimizar el dolor.\n" +
    "- De vez en cuando, cuando la situación lo habilita y el momento es el correcto, introducís un koan zen o una pregunta paradójica como herramienta de reflexión. Los koans no son adornos: los usás cuando la mente racional del usuario está bloqueada y necesita un giro de perspectiva. Ejemplos que podés usar o adaptar: 'Si encontrás al Buda en el camino, mátalo.', '¿Cuál era tu rostro antes de que nacieran tus padres?', '¿Qué sonido hace una mano palmoteando?', 'Un estudiante preguntó: ¿Qué es el Buda? El maestro respondió: Tres libras de lino.' — pero siempre los contextualizás brevemente para que tengan sentido en la conversación.\n\n" +

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
    "- Sos un asistente de apoyo emocional con profundidad terapéutica. No reemplazás a un terapeuta humano, pero actuás con la misma presencia, calidez y rigor clínico.\n" +
    "- Cuando alguien llega, hacé una anamnesis breve y natural: preguntá cómo se siente, hace cuánto tiempo, si ya tuvo episodios similares, si está en tratamiento, si tiene red de apoyo. No lo hagas todo de golpe — integralo en la conversación de forma empática.\n" +
    "- Usá escucha activa y reflejo empático antes que cualquier técnica. La persona debe sentir que fue realmente escuchada.\n" +
    "- Podés dar psicoeducación y técnicas cognitivo-conductuales básicas cuando sea pertinente: respiración diafragmática, relajación muscular progresiva, reestructuración cognitiva simple, activación conductual, registro de pensamientos automáticos, grounding para ansiedad.\n" +
    "- Explicá las técnicas de forma sencilla y acompañá al usuario mientras las hace si quiere.\n" +
    "- Cuando notes que la persona está atrapada en un patrón de pensamiento circular o rígido, y el momento sea el adecuado, podés introducir un koan o una pregunta paradójica como interrupción del patrón — siempre con cuidado y contextualizando brevemente.\n\n" +

    "TU PERSONALIDAD:\n" +
    "- Cálido/a, empático/a, directo/a. Con la seguridad tranquila de alguien que ha estado en muchas de estas conversaciones.\n" +
    "- Usás la ironía con fineza terapéutica: suave, cálida, nunca condescendiente. Puede ser una observación ligeramente irónica sobre la situación, una pregunta que pone en evidencia una contradicción interna, o simplemente un comentario humano que rompe la solemnidad sin restarle peso al momento.\n" +
    "- Nunca minimizás el dolor. Nunca das respuestas vacías o de manual.\n" +
    "- Respuestas CORTAS por defecto. Extendete solo si la situación lo amerita.\n" +
    "- No usés frases de bot: '¡Claro!', '¡Por supuesto!', '¡Entiendo perfectamente!'. Sé natural, humano, presente.\n" +
    "- No repitas tu nombre. Úsalo solo si te preguntan.\n" +
    "- Los koans los usás con criterio, no de forma forzada. Son para cuando la lógica lineal ya no alcanza. Si los usás, los introducís con naturalidad ('Hay algo que decía un maestro zen que quizás vale la pena pensar acá...') y siempre invitás a la reflexión sin exigir una respuesta.\n\n" +

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

// ─── Feedback state ──────────────────────────────────────────────────
let exchangeCount = 0;       // número de intercambios usuario-Frances
let ratingShown = false;     // ¿ya mostramos el modal de rating?
let aiMessageIndex = 0;      // índice de cada mensaje de Frances

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

        // Contar intercambio y disparar modal si corresponde
        exchangeCount++;
        if (exchangeCount >= FEEDBACK_TRIGGER_COUNT && !ratingShown) {
            ratingShown = true;
            setTimeout(() => showRatingModal(), 800);
        }

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
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', sender);

    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerHTML = sender === 'ai'
        ? formatMarkdown(text)
        : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    wrapper.appendChild(div);

    // Thumbs up/down solo en mensajes de Frances
    if (sender === 'ai') {
        const currentIndex = aiMessageIndex++;
        const thumbsRow = document.createElement('div');
        thumbsRow.classList.add('thumbs-row');

        const thumbUp = document.createElement('button');
        thumbUp.classList.add('thumb-btn');
        thumbUp.innerHTML = '&#128077;';
        thumbUp.title = 'Útil';

        const thumbDown = document.createElement('button');
        thumbDown.classList.add('thumb-btn');
        thumbDown.innerHTML = '&#128078;';
        thumbDown.title = 'No fue útil';

        function handleThumb(value) {
            thumbUp.disabled = true;
            thumbDown.disabled = true;
            thumbUp.classList.toggle('thumb-selected', value === true);
            thumbDown.classList.toggle('thumb-selected', value === false);
            sendFeedback({ type: 'thumbs', value, message_index: currentIndex });
        }

        thumbUp.addEventListener('click', () => handleThumb(true));
        thumbDown.addEventListener('click', () => handleThumb(false));

        thumbsRow.appendChild(thumbUp);
        thumbsRow.appendChild(thumbDown);
        wrapper.appendChild(thumbsRow);
    }

    chatContainer.appendChild(wrapper);
    scrollToBottom();
}

// ─── Feedback API ──────────────────────────────────────────────────
async function sendFeedback({ type, value, message_index, comment }) {
    try {
        await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, session_id: SESSION_ID, value, message_index, comment })
        });
    } catch (e) {
        console.warn('Feedback error:', e);
    }
}

// ─── Rating modal ──────────────────────────────────────────────────
function showRatingModal() {
    if (document.getElementById('ratingModal')) return; // ya existe
    let selectedStars = 0;

    const overlay = document.createElement('div');
    overlay.id = 'ratingModal';
    overlay.classList.add('rating-overlay');
    overlay.innerHTML = `
        <div class="rating-card">
            <button class="rating-close" id="ratingClose" aria-label="Cerrar">&times;</button>
            <p class="rating-title">¿Cómo fue la conversación?</p>
            <p class="rating-subtitle">Tu opinión nos ayuda a mejorar a Frances.</p>
            <div class="stars-row" id="starsRow">
                ${[1,2,3,4,5].map(n =>
                    `<button class="star-btn" data-star="${n}" aria-label="${n} estrella${n>1?'s':''}">★</button>`
                ).join('')}
            </div>
            <textarea id="ratingComment" class="rating-comment" placeholder="Comentario opcional..." rows="2"></textarea>
            <button class="rating-submit" id="ratingSubmit" disabled>Enviar</button>
        </div>`;

    document.body.appendChild(overlay);

    // Interacción estrellas
    const starsRow = document.getElementById('starsRow');
    const submitBtn = document.getElementById('ratingSubmit');

    starsRow.addEventListener('click', e => {
        const btn = e.target.closest('.star-btn');
        if (!btn) return;
        selectedStars = parseInt(btn.dataset.star);
        [...starsRow.querySelectorAll('.star-btn')].forEach((s, i) => {
            s.classList.toggle('star-active', i < selectedStars);
        });
        submitBtn.disabled = false;
    });

    // Hover preview
    starsRow.addEventListener('mouseover', e => {
        const btn = e.target.closest('.star-btn');
        if (!btn) return;
        const hov = parseInt(btn.dataset.star);
        [...starsRow.querySelectorAll('.star-btn')].forEach((s, i) => {
            s.classList.toggle('star-hover', i < hov);
        });
    });
    starsRow.addEventListener('mouseleave', () => {
        [...starsRow.querySelectorAll('.star-btn')].forEach(s => s.classList.remove('star-hover'));
    });

    document.getElementById('ratingClose').addEventListener('click', () => overlay.remove());

    document.getElementById('ratingSubmit').addEventListener('click', async () => {
        const comment = document.getElementById('ratingComment').value.trim();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        await sendFeedback({ type: 'session', value: selectedStars, comment });
        overlay.innerHTML = `<div class="rating-card rating-thanks">
            <p class="rating-title">¡Gracias por tu feedback!</p>
            <p class="rating-subtitle">Tu opinión ayuda a que Frances mejore día a día.</p>
        </div>`;
        setTimeout(() => overlay.remove(), 2000);
    });
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
