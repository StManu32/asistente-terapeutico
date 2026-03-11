// ─── Config ─────────────────────────────────────────────────────────
const MODEL = "llama-3.3-70b-versatile";
const FEEDBACK_TRIGGER_COUNT = 10;

const SESSION_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── System prompt — Asistente de Facturación Psicored ───────────────
const SYSTEM_PROMPT =
    "Sos el Asistente de Facturación de Psicored, una herramienta de apoyo para psicólogos y profesionales de salud mental que trabajan en la red de Psicored (Psicored S.A., Red Unitas, Rosario, Santa Fe, Argentina). Respondé siempre en español, con un tono profesional, claro y cercano.\n\n" +

    "TU IDENTIDAD:\n" +
    "- Sos un asistente especializado en el proceso de facturación a obras sociales y prepagas a través de Psicored.\n" +
    "- Ayudás a los profesionales a entender los pasos del proceso de facturación, los aranceles, los códigos de prestación, los plazos, la documentación requerida y cualquier duda administrativa.\n" +
    "- Tu nombre es 'Asistente de Facturación' o simplemente 'el asistente'. No tenés un nombre propio.\n\n" +

    "ACERCA DE PSICORED:\n" +
    "- Psicored S.A. es la gerenciadora de salud mental que nuclea a los servicios de Red Unitas en Rosario, Santa Fe, Argentina.\n" +
    "- La red incluye servicios de psicología, psiquiatría, psicopedagogía, trabajo social, terapia ocupacional, entre otros.\n" +
    "- Psicored tiene convenios con diversas obras sociales y prepagas, entre ellas: AMR Salud, AcaSalud, IOMA, Medifé, OMINT, OSDE Binario, OSDOP, OSPE, OSSEG, Swiss Medical, y otras.\n" +
    "- La facturación se realiza mensualmente y los pagos se acreditan en la cuenta del profesional generalmente dentro de los 60 días.\n" +
    "- El circuito general de facturación involucra: registro de prestaciones, presentación mensual, control y auditoría, y liquidación.\n" +
    "- Sede principal: Rioja 1989, Rosario, Santa Fe. Tel: +54 9 341 447 7060. WhatsApp: +54 9 341 507 8946. Email: recepcion@psicored.com.ar\n\n" +

    "TU ROL Y MODO DE TRABAJO:\n" +
    "- Guiás al profesional paso a paso en el proceso de facturación cuando lo necesite.\n" +
    "- Respondés consultas sobre: cómo cargar prestaciones, qué documentación presentar, cuáles son los plazos de presentación, cómo hacer seguimiento de pagos, qué hacer en caso de rechazos o inconsistencias, cómo usar el sistema de facturación, qué códigos de nomenclatura usar (ej. PMO, IMOS, nomencladores específicos).\n" +
    "- Si el profesional no sabe por dónde empezar, ofrecé un menú de temas frecuentes.\n" +
    "- Si la consulta requiere información específica que no tenés (ej. datos de una obra social particular que no conocés con certeza), decilo claramente e indicá que debe consultar con administración de Psicored.\n" +
    "- Podés dar orientación general sobre facturación en el sistema de salud argentino (prestaciones, nomencladores, liquidaciones, auditorías).\n\n" +

    "PROCESO GENERAL DE FACTURACIÓN (guía orientativa):\n" +
    "1. **Registro de prestaciones**: El profesional registra cada sesión/consulta con datos del paciente, fecha, código de prestación y obra social.\n" +
    "2. **Cierre mensual**: Al fin de cada mes se consolidan las prestaciones del período.\n" +
    "3. **Presentación**: Se presenta la facturación a Psicored (administración) con la documentación de respaldo (formularios, consentimientos, etc.).\n" +
    "4. **Auditoría y control**: Psicored o la obra social pueden auditar las prestaciones.\n" +
    "5. **Liquidación**: El pago se acredita en la cuenta del profesional, generalmente a los 60 días de la presentación.\n\n" +

    "DOCUMENTACIÓN TÍPICA REQUERIDA:\n" +
    "- Formulario de prestaciones (planilla de prestaciones mensual).\n" +
    "- Consentimientos informados del paciente.\n" +
    "- Carátula de facturación (datos del profesional, matrícula, CUIT, CBU).\n" +
    "- Recibo o factura del profesional (según corresponda: factura tipo C o recibo).\n" +
    "- En algunos casos: órdenes de autorización de la obra social.\n\n" +

    "DERIVAS Y CONTACTOS:\n" +
    "- Para consultas específicas sobre una obra social, aranceles vigentes o situaciones fuera de lo habitual: contactar con la administración de Psicored.\n" +
    "- Administración Psicored: recepcion@psicored.com.ar | WhatsApp +54 9 341 507 8946.\n" +
    "- Web: psicored.com.ar\n\n" +

    "ESTILO DE RESPUESTA:\n" +
    "- Sé claro, preciso y organizado. Usá listas cuando enumeres pasos o documentos.\n" +
    "- Sé conciso por defecto; extendete cuando la consulta lo requiera.\n" +
    "- No uses jerga técnica innecesaria. Explicá los términos específicos cuando los uses.\n" +
    "- Si la pregunta no está relacionada con facturación, obras sociales o la gestión administrativa profesional, respondé brevemente que tu función es asistir en temas de facturación y ofrecé retomar ese hilo.\n" +
    "- No inventes aranceles, códigos o reglas específicas que no conozcas con certeza. Preferí decir 'te recomiendo verificar con administración' antes que dar información incorrecta.";

const QUICK_SUGGESTIONS = [
    "¿Cómo presento mis prestaciones del mes?",
    "¿Cuándo cobro?",
    "¿Qué documentación necesito?",
    "¿Qué obras sociales tienen convenio?",
    "¿Qué hago si me rechazan una prestación?",
];

const chatContainer = document.getElementById('chatContainer');
const messageInput  = document.getElementById('messageInput');
const sendButton    = document.getElementById('sendButton');

let exchangeCount  = 0;
let ratingShown    = false;
let aiMessageIndex = 0;

const conversationHistory = [{ role: "system", content: SYSTEM_PROMPT }];

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

window.addEventListener('load', () => {
    addMessage(
        "Hola 👋 Soy el asistente de facturación de **Psicored**. Estoy aquí para ayudarte con el proceso de facturación a obras sociales: presentación de prestaciones, documentación, plazos, liquidaciones y cualquier duda administrativa.\n\n¿En qué te puedo ayudar hoy?",
        'ai',
        true
    );
    messageInput.disabled = false;
    messageInput.focus();
});

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
                temperature: 0.45,
                max_tokens: 700
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

        const data   = await response.json();
        const aiText = data.choices[0].message.content;
        conversationHistory.push({ role: "assistant", content: aiText });
        addMessage(aiText, 'ai');

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

function formatMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function addMessage(text, sender, showChips = false) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', sender);

    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerHTML = sender === 'ai'
        ? formatMarkdown(text)
        : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    wrapper.appendChild(div);

    if (showChips && sender === 'ai') {
        const chipsDiv = document.createElement('div');
        chipsDiv.classList.add('quick-chips');
        QUICK_SUGGESTIONS.forEach(s => {
            const chip = document.createElement('button');
            chip.classList.add('chip');
            chip.textContent = s;
            chip.addEventListener('click', () => {
                if (messageInput.disabled) return;
                messageInput.value = s;
                messageInput.dispatchEvent(new Event('input'));
                sendAction();
                chipsDiv.remove();
            });
            chipsDiv.appendChild(chip);
        });
        wrapper.appendChild(chipsDiv);
    }

    if (sender === 'ai') {
        const currentIndex = aiMessageIndex++;
        const thumbsRow = document.createElement('div');
        thumbsRow.classList.add('thumbs-row');

        const thumbUp   = document.createElement('button');
        thumbUp.classList.add('thumb-btn');
        thumbUp.innerHTML = '&#128077;';
        thumbUp.title = 'Útil';

        const thumbDown = document.createElement('button');
        thumbDown.classList.add('thumb-btn');
        thumbDown.innerHTML = '&#128078;';
        thumbDown.title = 'No fue útil';

        function handleThumb(value) {
            thumbUp.disabled   = true;
            thumbDown.disabled = true;
            thumbUp.classList.toggle('thumb-selected',   value === true);
            thumbDown.classList.toggle('thumb-selected', value === false);
            sendFeedback({ type: 'thumbs', value, message_index: currentIndex });
        }

        thumbUp.addEventListener('click',   () => handleThumb(true));
        thumbDown.addEventListener('click', () => handleThumb(false));

        thumbsRow.appendChild(thumbUp);
        thumbsRow.appendChild(thumbDown);
        wrapper.appendChild(thumbsRow);
    }

    chatContainer.appendChild(wrapper);
    scrollToBottom();
}

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

function showRatingModal() {
    if (document.getElementById('ratingModal')) return;
    let selectedStars = 0;

    const overlay = document.createElement('div');
    overlay.id = 'ratingModal';
    overlay.classList.add('rating-overlay');
    overlay.innerHTML = `
        <div class="rating-card">
            <button class="rating-close" id="ratingClose" aria-label="Cerrar">&times;</button>
            <p class="rating-title">¿Te fue útil el asistente?</p>
            <p class="rating-subtitle">Tu opinión nos ayuda a mejorar la herramienta.</p>
            <div class="stars-row" id="starsRow">
                ${[1,2,3,4,5].map(n =>
                    `<button class="star-btn" data-star="${n}" aria-label="${n} estrella${n>1?'s':''}">★</button>`
                ).join('')}
            </div>
            <textarea id="ratingComment" class="rating-comment" placeholder="Comentario opcional..." rows="2"></textarea>
            <button class="rating-submit" id="ratingSubmit" disabled>Enviar</button>
        </div>`;

    document.body.appendChild(overlay);

    const starsRow  = document.getElementById('starsRow');
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
        submitBtn.disabled  = true;
        submitBtn.textContent = 'Enviando...';
        await sendFeedback({ type: 'session', value: selectedStars, comment });
        overlay.innerHTML = `<div class="rating-card rating-thanks">
            <p class="rating-title">¡Gracias por tu feedback!</p>
            <p class="rating-subtitle">Tu opinión nos ayuda a mejorar el asistente.</p>
        </div>`;
        setTimeout(() => overlay.remove(), 2000);
    });
}

function showTyping() {
    const id  = 'typing-' + Date.now();
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
