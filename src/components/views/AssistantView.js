import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class AssistantView extends LitElement {
    static styles = css`
        :host {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: var(--bg-app);
            position: relative;
            overflow: hidden;
        }

        * {
            box-sizing: border-box;
            font-family: var(--font);
            cursor: default;
        }

        /* ── Response / Chat Area ── */

        .response-container {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: var(--space-md);
            background: var(--bg-app);
            scroll-behavior: smooth;
            position: relative;
        }

        .response-container::-webkit-scrollbar {
            width: 6px;
        }

        .response-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .response-container::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 3px;
        }

        .response-container::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }

        /* ── Chat Messages ── */

        .message-row {
            display: flex;
            width: 100%;
            animation: messageFadeIn 0.16s ease-out;
        }

        @keyframes messageFadeIn {
            from {
                opacity: 0;
                transform: translateY(4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message-row.user {
            justify-content: flex-end;
        }

        .message-row.interviewer {
            justify-content: flex-start;
        }

        .message-row.ai {
            justify-content: flex-start;
        }

        .message-row.screen {
            justify-content: flex-end;
        }

        .message-bubble {
            max-width: 88%;
            border-radius: 14px;
            padding: 10px 14px;
            word-break: break-word;
            user-select: text;
            cursor: text;
            font-size: var(--response-font-size, 14.5px);
            line-height: var(--line-height, 1.5);
            position: relative;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .message-bubble * {
            user-select: text;
            cursor: text;
        }

        /* Candidate user prompt */
        .message-row.user .message-bubble {
            background: var(--accent);
            color: #ffffff;
            border-bottom-right-radius: 3px;
        }

        /* Screen Analysis prompt */
        .message-row.screen .message-bubble {
            background: var(--bg-surface);
            color: var(--text-primary);
            border: 1px dashed var(--border-strong);
            border-bottom-right-radius: 3px;
        }

        /* Interviewer Question */
        .message-row.interviewer .message-bubble {
            background: rgba(30, 58, 138, 0.24);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: var(--text-primary);
            border-bottom-left-radius: 3px;
        }

        /* AI Suggested Response (Teleprompter) */
        .message-row.ai .message-bubble {
            background: var(--bg-surface);
            border: 1px solid var(--border);
            color: var(--text-primary);
            border-bottom-left-radius: 3px;
        }

        /* ── Bubble Header & Meta ── */

        .bubble-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 11px;
            font-family: var(--font-mono);
            user-select: none;
        }

        .bubble-header * {
            user-select: none;
            cursor: default;
        }

        .bubble-tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 2px 7px;
            border-radius: 4px;
        }

        .message-row.user .bubble-tag {
            background: rgba(255, 255, 255, 0.22);
            color: #ffffff;
        }

        .message-row.screen .bubble-tag {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .message-row.interviewer .bubble-tag {
            background: rgba(59, 130, 246, 0.24);
            color: #93c5fd;
            border: 1px solid rgba(59, 130, 246, 0.4);
        }

        .message-row.ai .bubble-tag {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .bubble-actions {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .bubble-time {
            font-size: 10px;
            opacity: 0.6;
        }

        .copy-btn {
            background: none;
            border: 1px solid transparent;
            color: var(--text-muted);
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-family: var(--font-mono);
            transition: color 0.15s, background 0.15s, border-color 0.15s;
        }

        .copy-btn:hover {
            color: var(--text-primary);
            background: var(--bg-hover);
            border-color: var(--border);
        }

        .copy-btn.copied {
            color: #10b981;
            border-color: rgba(16, 185, 129, 0.3);
            background: rgba(16, 185, 129, 0.1);
        }

        /* ── Markdown in AI Bubbles ── */

        .markdown-body {
            font-size: var(--response-font-size, 14.5px);
            line-height: var(--line-height, 1.5);
            color: var(--text-primary);
        }

        .markdown-body p {
            margin: 0.4em 0;
        }

        .markdown-body p:first-child {
            margin-top: 0;
        }

        .markdown-body p:last-child {
            margin-bottom: 0;
        }

        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4 {
            margin: 0.8em 0 0.4em 0;
            color: var(--text-primary);
            font-weight: var(--font-weight-semibold);
        }

        .markdown-body h1 { font-size: 1.35em; }
        .markdown-body h2 { font-size: 1.2em; }
        .markdown-body h3 { font-size: 1.1em; }
        .markdown-body h4 { font-size: 1.02em; }

        .markdown-body ul,
        .markdown-body ol {
            margin: 0.4em 0;
            padding-left: 1.4em;
        }

        .markdown-body li {
            margin: 0.25em 0;
        }

        .markdown-body strong,
        .markdown-body b {
            font-weight: 600;
            color: #93c5fd;
        }

        .markdown-body code {
            background: var(--bg-elevated);
            padding: 0.15em 0.4em;
            border-radius: var(--radius-sm);
            font-family: var(--font-mono);
            font-size: 0.88em;
            color: #fca5a5;
        }

        .markdown-body pre {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: var(--space-sm) var(--space-md);
            overflow-x: auto;
            margin: 0.5em 0;
        }

        .markdown-body pre code {
            background: none;
            padding: 0;
            color: var(--text-primary);
        }

        .markdown-body blockquote {
            margin: 0.5em 0;
            padding: 0.4em 0.8em;
            border-left: 2px solid var(--border-strong);
            background: var(--bg-elevated);
            border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        .message-text {
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* ── Empty State ── */

        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: var(--space-xl) var(--space-md);
            color: var(--text-muted);
            user-select: none;
            min-height: 240px;
        }

        .empty-badge {
            font-size: 10px;
            font-family: var(--font-mono);
            font-weight: 600;
            letter-spacing: 1px;
            color: #10b981;
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.25);
            padding: 3px 10px;
            border-radius: 100px;
            margin-bottom: 12px;
        }

        .empty-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 6px;
        }

        .empty-desc {
            font-size: 13px;
            max-width: 320px;
            line-height: 1.45;
            margin-bottom: 18px;
        }

        .empty-shortcuts {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }

        .shortcut-pill {
            font-size: 11px;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            padding: 4px 10px;
            border-radius: 6px;
            color: var(--text-secondary);
        }

        .shortcut-pill kbd {
            background: var(--bg-elevated);
            border: 1px solid var(--border-strong);
            padding: 1px 5px;
            border-radius: 3px;
            font-family: var(--font-mono);
            font-size: 10px;
        }

        /* ── Floating Scroll Bottom Button ── */

        .scroll-bottom-btn {
            position: absolute;
            bottom: 64px;
            right: 20px;
            background: var(--bg-surface);
            border: 1px solid var(--border-strong);
            color: var(--text-primary);
            padding: 6px 12px;
            border-radius: 100px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-family: var(--font-mono);
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
            transition: all 0.2s ease;
            z-index: 10;
        }

        .scroll-bottom-btn:hover {
            background: var(--bg-hover);
            transform: translateY(-1px);
        }

        /* ── Bottom input bar ── */

        .input-bar {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-md);
            background: var(--bg-app);
            border-top: 1px solid var(--border);
        }

        .input-bar-inner {
            display: flex;
            align-items: center;
            flex: 1;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 100px;
            padding: 0 var(--space-md);
            height: 32px;
            transition: border-color var(--transition);
        }

        .input-bar-inner:focus-within {
            border-color: var(--accent);
        }

        .input-bar-inner input {
            flex: 1;
            background: none;
            color: var(--text-primary);
            border: none;
            padding: 0;
            font-size: var(--font-size-sm);
            font-family: var(--font);
            height: 100%;
            outline: none;
        }

        .input-bar-inner input::placeholder {
            color: var(--text-muted);
        }

        .analyze-btn {
            position: relative;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            cursor: pointer;
            font-size: var(--font-size-xs);
            font-family: var(--font-mono);
            white-space: nowrap;
            padding: var(--space-xs) var(--space-md);
            border-radius: 100px;
            height: 32px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: border-color 0.4s ease, background var(--transition);
            flex-shrink: 0;
            overflow: hidden;
        }

        .analyze-btn:hover:not(.analyzing) {
            border-color: var(--accent);
            background: var(--bg-surface);
        }

        .analyze-btn.analyzing {
            cursor: default;
            border-color: transparent;
        }

        .analyze-btn-content {
            display: flex;
            align-items: center;
            gap: 4px;
            transition: opacity 0.4s ease;
            z-index: 1;
            position: relative;
        }

        .analyze-btn.analyzing .analyze-btn-content {
            opacity: 0;
        }

        .analyze-canvas {
            position: absolute;
            inset: -1px;
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            pointer-events: none;
        }
    `;

    static properties = {
        responses: { type: Array },
        currentResponseIndex: { type: Number },
        selectedProfile: { type: String },
        statusText: { type: String },
        onSendText: { type: Function },
        shouldAnimateResponse: { type: Boolean },
        isAnalyzing: { type: Boolean, state: true },
        _copiedId: { state: true },
        _showScrollBottom: { state: true },
    };

    constructor() {
        super();
        this.responses = [];
        this.currentResponseIndex = -1;
        this.selectedProfile = 'interview';
        this.statusText = '';
        this.onSendText = () => {};
        this.isAnalyzing = false;
        this._copiedId = null;
        this._showScrollBottom = false;
        this._animFrame = null;
    }

    getProfileNames() {
        return {
            interview: 'Job Interview',
            sales: 'Sales Call',
            meeting: 'Business Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation',
            exam: 'Exam Assistant',
        };
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    async handleCopy(msgId, text) {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            this._copiedId = msgId;
            this.requestUpdate();
            setTimeout(() => {
                if (this._copiedId === msgId) {
                    this._copiedId = null;
                    this.requestUpdate();
                }
            }, 1600);
        } catch (e) {
            console.warn('Failed to copy to clipboard:', e);
        }
    }

    renderMarkdown(content) {
        if (!content) return '';
        if (typeof window !== 'undefined' && window.marked) {
            try {
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false,
                });
                return window.marked.parse(content);
            } catch (error) {
                console.warn('Error parsing markdown:', error);
                return content;
            }
        }
        return content;
    }

    scrollResponseUp() {
        const container = this.shadowRoot.querySelector('#responseContainer');
        if (container) {
            const scrollAmount = container.clientHeight * 0.35;
            container.scrollTop = Math.max(0, container.scrollTop - scrollAmount);
        }
    }

    scrollResponseDown() {
        const container = this.shadowRoot.querySelector('#responseContainer');
        if (container) {
            const scrollAmount = container.clientHeight * 0.35;
            container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + scrollAmount);
        }
    }

    handleContainerScroll(e) {
        const container = e.target;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
        if (this._showScrollBottom !== !isNearBottom) {
            this._showScrollBottom = !isNearBottom;
            this.requestUpdate();
        }
    }

    scrollToBottom(force = false) {
        requestAnimationFrame(() => {
            const container = this.shadowRoot.querySelector('#responseContainer');
            if (!container) return;
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
            if (force || isNearBottom) {
                container.scrollTop = container.scrollHeight;
            }
        });
    }

    connectedCallback() {
        super.connectedCallback();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            this.handleScrollUp = () => this.scrollResponseUp();
            this.handleScrollDown = () => this.scrollResponseDown();

            ipcRenderer.on('scroll-response-up', this.handleScrollUp);
            ipcRenderer.on('scroll-response-down', this.handleScrollDown);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopWaveformAnimation();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            if (this.handleScrollUp) ipcRenderer.removeListener('scroll-response-up', this.handleScrollUp);
            if (this.handleScrollDown) ipcRenderer.removeListener('scroll-response-down', this.handleScrollDown);
        }
    }

    async handleSendText() {
        const textInput = this.shadowRoot.querySelector('#textInput');
        if (textInput && textInput.value.trim()) {
            const message = textInput.value.trim();
            textInput.value = '';
            await this.onSendText(message);
            this.scrollToBottom(true);
        }
    }

    handleTextKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    async handleScreenAnswer() {
        if (this.isAnalyzing) return;
        if (window.captureManualScreenshot) {
            this.isAnalyzing = true;
            this._responseCountWhenStarted = this.responses.length;
            this.dispatchEvent(new CustomEvent('screen-analysis-requested', { bubbles: true, composed: true }));
            window.captureManualScreenshot();
        }
    }

    _startWaveformAnimation() {
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const dangerColor = getComputedStyle(this).getPropertyValue('--danger').trim() || '#EF4444';
        const startTime = performance.now();
        const FADE_IN = 0.5;
        const PARTICLE_SPREAD = 4;
        const PARTICLE_COUNT = 250;

        const w = rect.width;
        const h = rect.height;
        const r = h / 2;
        const straightLen = w - 2 * r;
        const arcLen = Math.PI * r;
        const perimeter = 2 * straightLen + 2 * arcLen;

        const pointOnPerimeter = (d) => {
            d = ((d % perimeter) + perimeter) % perimeter;
            if (d < straightLen) {
                return { x: r + d, y: 0, nx: 0, ny: 1 };
            }
            d -= straightLen;
            if (d < arcLen) {
                const angle = -Math.PI / 2 + (d / arcLen) * Math.PI;
                return {
                    x: w - r + Math.cos(angle) * r,
                    y: r + Math.sin(angle) * r,
                    nx: -Math.cos(angle),
                    ny: -Math.sin(angle),
                };
            }
            d -= arcLen;
            if (d < straightLen) {
                return { x: w - r - d, y: h, nx: 0, ny: -1 };
            }
            d -= straightLen;
            const angle = Math.PI / 2 + (d / arcLen) * Math.PI;
            return {
                x: r + Math.cos(angle) * r,
                y: r + Math.sin(angle) * r,
                nx: -Math.cos(angle),
                ny: -Math.sin(angle),
            };
        };

        const seeds = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            seeds.push({ pos: Math.random(), drift: Math.random(), depthSeed: Math.random() });
        }

        const draw = (now) => {
            const elapsed = (now - startTime) / 1000;
            const fade = Math.min(1, elapsed / FADE_IN);

            ctx.clearRect(0, 0, w, h);

            ctx.fillStyle = dangerColor;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const s = seeds[i];
                const along = (s.pos + s.drift * elapsed * 0.03) * perimeter;
                const depth = s.depthSeed * PARTICLE_SPREAD;
                const density = 1 - depth / PARTICLE_SPREAD;

                if (Math.random() > density) continue;

                const p = pointOnPerimeter(along);
                const px = p.x + p.nx * depth;
                const py = p.y + p.ny * depth;
                const size = 0.8 + density * 0.6;

                ctx.globalAlpha = fade * density * 0.85;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }

            const midY = h / 2;
            const waves = [
                { freq: 3, amp: 0.35, speed: 2.5, opacity: 0.9, width: 1.8 },
                { freq: 5, amp: 0.2, speed: 3.5, opacity: 0.5, width: 1.2 },
                { freq: 7, amp: 0.12, speed: 5, opacity: 0.3, width: 0.8 },
            ];

            for (const wave of waves) {
                ctx.beginPath();
                ctx.strokeStyle = dangerColor;
                ctx.globalAlpha = wave.opacity * fade;
                ctx.lineWidth = wave.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                for (let x = 0; x <= w; x++) {
                    const norm = x / w;
                    const envelope = Math.sin(norm * Math.PI);
                    const y = midY + Math.sin(norm * Math.PI * 2 * wave.freq + elapsed * wave.speed) * (midY * wave.amp) * envelope;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
            this._animFrame = requestAnimationFrame(draw);
        };

        this._animFrame = requestAnimationFrame(draw);
    }

    _stopWaveformAnimation() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('responses')) {
            this.scrollToBottom();
        }

        if (changedProperties.has('isAnalyzing')) {
            if (this.isAnalyzing) {
                this._startWaveformAnimation();
            } else {
                this._stopWaveformAnimation();
            }
        }

        if (changedProperties.has('responses') && this.isAnalyzing) {
            if (this.responses.length > this._responseCountWhenStarted) {
                this.isAnalyzing = false;
            }
        }
    }

    renderMessageBubble(msg, index) {
        const normalizedMsg = typeof msg === 'string'
            ? { id: `ai-${index}`, type: 'ai', content: msg, timestamp: Date.now() }
            : msg;

        const isAi = normalizedMsg.type === 'ai';
        const isInterviewer = normalizedMsg.type === 'interviewer';
        const isUser = normalizedMsg.type === 'user';
        const isScreen = normalizedMsg.type === 'screen';
        const msgId = normalizedMsg.id || `msg-${index}`;
        const isCopied = this._copiedId === msgId;

        let tagLabel = 'AI Teleprompter';
        let tagIcon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;

        if (isInterviewer) {
            tagLabel = 'Interviewer';
            tagIcon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
        } else if (isUser) {
            tagLabel = 'You';
            tagIcon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        } else if (isScreen) {
            tagLabel = 'Screen Analysis';
            tagIcon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
        }

        return html`
            <div class="message-row ${normalizedMsg.type || 'ai'}">
                <div class="message-bubble">
                    <div class="bubble-header">
                        <span class="bubble-tag">
                            ${tagIcon}
                            ${tagLabel}
                        </span>
                        <div class="bubble-actions">
                            <span class="bubble-time">${this.formatTime(normalizedMsg.timestamp)}</span>
                            ${isAi ? html`
                                <button
                                    class="copy-btn ${isCopied ? 'copied' : ''}"
                                    @click=${() => this.handleCopy(msgId, normalizedMsg.content)}
                                    title="Copy answer"
                                >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        ${isCopied
                                            ? html`<polyline points="20 6 9 17 4 12"></polyline>`
                                            : html`<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>`}
                                    </svg>
                                    <span>${isCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${isAi
                        ? html`<div class="markdown-body" .innerHTML=${this.renderMarkdown(normalizedMsg.content || '')}></div>`
                        : html`<div class="message-text">${normalizedMsg.content || ''}</div>`}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="response-container" id="responseContainer" @scroll=${this.handleContainerScroll}>
                ${this.responses.length === 0 ? html`
                    <div class="empty-state">
                        <div class="empty-badge">ENGLISH INTERVIEW MODE</div>
                        <div class="empty-title">Ready & Listening</div>
                        <div class="empty-desc">
                            Questions from your interviewer and ready-to-speak English responses will appear here in a real-time chat thread.
                        </div>
                        <div class="empty-shortcuts">
                            <span class="shortcut-pill"><kbd>F9</kbd> Hide/Show window</span>
                            <span class="shortcut-pill"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> Analyze Screen</span>
                        </div>
                    </div>
                ` : this.responses.map((msg, idx) => this.renderMessageBubble(msg, idx))}
            </div>

            ${this._showScrollBottom ? html`
                <button class="scroll-bottom-btn" @click=${() => this.scrollToBottom(true)} title="Jump to latest response">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Latest
                </button>
            ` : ''}

            <div class="input-bar">
                <div class="input-bar-inner">
                    <input
                        type="text"
                        id="textInput"
                        placeholder="Type a question or message in English..."
                        @keydown=${this.handleTextKeydown}
                    />
                </div>
                <button class="analyze-btn ${this.isAnalyzing ? 'analyzing' : ''}" @click=${this.handleScreenAnswer}>
                    <canvas class="analyze-canvas"></canvas>
                    <span class="analyze-btn-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 3v7h6l-8 11v-7H5z" />
                        </svg>
                        Analyze Screen
                    </span>
                </button>
            </div>
        `;
    }
}

customElements.define('assistant-view', AssistantView);
