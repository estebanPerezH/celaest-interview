import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import {
    DEFAULT_PRESENTATION_SCRIPT,
    buildEyeConeChunks,
    computeOrpSplit,
    extractCueCards,
    parseScriptToSlides,
} from '../../utils/eyelockEngine.js';

const STORAGE_KEY_SCRIPT = 'celaest_eyelock_script_v1';
const STORAGE_KEY_SETTINGS = 'celaest_eyelock_settings_v1';

export class EyeLockPrompter extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            background: var(--bg-app, rgba(10, 10, 12, 0.92));
            color: var(--text-primary, #f5f5f5);
            font-family: var(--font, 'Inter', system-ui, sans-serif);
            overflow: hidden;
            user-select: none;
            position: relative;
        }

        .studio-shell {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            padding-top: 38px;
            overflow: hidden;
        }

        .studio-shell.docked {
            padding-top: 0;
        }

        .studio-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 16px 10px;
            border-bottom: 1px solid var(--border, #222226);
            background: var(--bg-surface, #111114);
        }

        .studio-header.hidden {
            display: none;
        }

        .studio-title-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .studio-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary, #f5f5f5);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .studio-badge {
            font-size: 10px;
            font-family: var(--font-mono, monospace);
            color: #34d399;
            background: rgba(16, 185, 129, 0.14);
            border: 1px solid rgba(16, 185, 129, 0.35);
            padding: 2px 7px;
            border-radius: 100px;
        }

        .studio-subtitle {
            font-size: 11.5px;
            color: var(--text-secondary, #9ca3af);
        }

        * {
            box-sizing: border-box;
        }

        /* ── Top Camera Axis Reticle (pins gaze right below webcam lens) ── */
        .camera-axis-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            background: linear-gradient(180deg, rgba(16, 185, 129, 0.14) 0%, rgba(10, 10, 12, 0.4) 100%);
            border-bottom: 1px solid rgba(52, 211, 153, 0.25);
            min-height: 28px;
            gap: 6px;
        }

        .camera-target {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 0 auto;
            font-family: var(--font-mono, monospace);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.8px;
            color: #6ee7b7;
            text-transform: uppercase;
        }

        .camera-lens-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25), 0 0 10px #10b981;
            transition: transform 0.12s ease, background 0.15s ease, box-shadow 0.15s ease;
        }

        .camera-lens-dot.speaking {
            background: #38bdf8;
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.35), 0 0 14px #38bdf8;
            transform: scale(1.22);
        }

        .camera-lens-dot.paused {
            background: #f59e0b;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.22);
        }

        /* ── Compact Control Toolbar ── */
        .toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
            padding: 5px 8px;
            background: var(--bg-surface, #121215);
            border-bottom: 1px solid var(--border, #222226);
            font-size: 11px;
        }

        .toolbar-group {
            display: inline-flex;
            align-items: center;
            gap: 3px;
        }

        .seg-pill {
            display: inline-flex;
            background: var(--bg-elevated, #19191d);
            border: 1px solid var(--border, #26262b);
            border-radius: 6px;
            padding: 1px;
            gap: 1px;
        }

        .seg-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary, #9ca3af);
            font-size: 10.5px;
            font-weight: 600;
            padding: 3px 7px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.14s ease;
            white-space: nowrap;
        }

        .seg-btn:hover {
            color: var(--text-primary, #ffffff);
        }

        .seg-btn.active {
            background: rgba(59, 130, 246, 0.22);
            color: #93c5fd;
            box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.45);
        }

        .seg-btn.active-emerald {
            background: rgba(16, 185, 129, 0.2);
            color: #6ee7b7;
            box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.4);
        }

        .icon-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--bg-elevated, #19191d);
            border: 1px solid var(--border, #2a2a30);
            color: var(--text-primary, #f3f4f6);
            font-size: 10.5px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.14s ease;
            white-space: nowrap;
        }

        .icon-btn:hover {
            border-color: var(--accent, #3b82f6);
            background: var(--bg-hover, #222228);
        }

        .icon-btn.primary {
            background: rgba(16, 185, 129, 0.18);
            border-color: rgba(16, 185, 129, 0.45);
            color: #6ee7b7;
        }

        .icon-btn.docked {
            background: rgba(56, 189, 248, 0.18);
            border-color: rgba(56, 189, 248, 0.45);
            color: #7dd3fc;
        }

        .wpm-control {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            font-family: var(--font-mono, monospace);
            font-size: 10px;
            color: var(--text-secondary, #9ca3af);
            background: var(--bg-elevated, #19191d);
            border: 1px solid var(--border, #26262b);
            border-radius: 6px;
            padding: 2px 5px;
        }

        .wpm-step {
            background: none;
            border: none;
            color: var(--text-primary, #f5f5f5);
            cursor: pointer;
            font-weight: 700;
            font-size: 11px;
            padding: 0 3px;
        }

        /* ── Main Optical Teleprompter Viewport (Top-Weighted near Camera) ── */
        .optical-stage {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 6px 10px 8px;
            overflow: hidden;
            position: relative;
        }

        /* Narrow Optical Cone: max 310px (~3.2 degrees horizontal visual angle at 55cm) */
        .eye-cone-column {
            width: 100%;
            max-width: 310px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }

        /* ── MODE 1: CAMERA-NOTCH STRIP (3-4 words per line, fixed upper eye-lock zone) ── */
        .notch-focus-band {
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 4px 0;
        }

        .notch-line {
            width: 100%;
            text-align: center;
            padding: 5px 10px;
            border-radius: 8px;
            transition: all 0.16s cubic-bezier(0.22, 1, 0.36, 1);
            line-height: 1.32;
            letter-spacing: -0.01em;
        }

        .notch-line.prev {
            font-size: 13px;
            color: var(--text-muted, #6b7280);
            opacity: 0.28;
            transform: scale(0.94);
            min-height: 24px;
        }

        .notch-line.active {
            font-size: 19px;
            font-weight: 600;
            color: #ffffff;
            background: linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.18) 50%, rgba(16, 185, 129, 0.12) 100%);
            border-top: 1.5px solid rgba(56, 189, 248, 0.65);
            border-bottom: 1.5px solid rgba(16, 185, 129, 0.55);
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
            padding: 8px 12px;
        }

        .notch-line.active.gaze-cue {
            background: rgba(16, 185, 129, 0.22);
            border-color: #10b981;
            color: #6ee7b7;
            font-size: 14px;
            font-family: var(--font-mono, monospace);
            letter-spacing: 0.5px;
        }

        .notch-line.next-1 {
            font-size: 15.5px;
            font-weight: 500;
            color: rgba(243, 244, 246, 0.68);
        }

        .notch-line.next-2 {
            font-size: 13.5px;
            color: rgba(156, 163, 175, 0.38);
        }

        .anchor-word {
            color: #38bdf8;
            font-weight: 700;
            text-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
        }

        /* ── MODE 2: FOCAL POINT / RSVP (Zero Pupil Movement) ── */
        .rsvp-box {
            width: 100%;
            background: rgba(17, 17, 21, 0.9);
            border: 1.5px solid rgba(56, 189, 248, 0.45);
            border-radius: 12px;
            padding: 12px 10px 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .rsvp-crosshair-top,
        .rsvp-crosshair-bottom {
            width: 2px;
            height: 7px;
            background: #10b981;
            opacity: 0.85;
        }

        .rsvp-word-row {
            display: flex;
            align-items: baseline;
            justify-content: center;
            width: 100%;
            font-size: 22px;
            font-weight: 600;
            line-height: 1.25;
            padding: 4px 0;
            font-kerning: normal;
        }

        .rsvp-left {
            flex: 1;
            text-align: right;
            color: #f3f4f6;
            white-space: pre;
        }

        .rsvp-focal {
            color: #34d399;
            font-weight: 800;
            text-decoration: underline;
            text-decoration-color: rgba(52, 211, 153, 0.6);
            text-underline-offset: 4px;
        }

        .rsvp-right {
            flex: 1;
            text-align: left;
            color: #f3f4f6;
            white-space: pre;
        }

        .rsvp-peripheral-preview {
            margin-top: 6px;
            font-size: 12px;
            color: rgba(156, 163, 175, 0.55);
            text-align: center;
            min-height: 16px;
        }

        /* ── MODE 3: GLANCE CUE-CARDS (0.5s Glance + Camera Eye Contact) ── */
        .cue-card {
            width: 100%;
            background: linear-gradient(180deg, rgba(25, 25, 32, 0.95) 0%, rgba(15, 15, 20, 0.95) 100%);
            border: 1px solid rgba(59, 130, 246, 0.4);
            border-radius: 12px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 7px;
            text-align: center;
        }

        .cue-anchors {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 5px;
        }

        .cue-anchor-pill {
            background: rgba(56, 189, 248, 0.16);
            border: 1px solid rgba(56, 189, 248, 0.45);
            color: #7dd3fc;
            font-size: 13.5px;
            font-weight: 700;
            padding: 2px 9px;
            border-radius: 6px;
        }

        .cue-takeaway {
            font-size: 14px;
            line-height: 1.38;
            color: #e5e7eb;
            max-width: 285px;
        }

        .cue-gaze-prompt {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-family: var(--font-mono, monospace);
            font-size: 10px;
            font-weight: 700;
            color: #6ee7b7;
            background: rgba(16, 185, 129, 0.14);
            border: 1px solid rgba(16, 185, 129, 0.35);
            padding: 3px 8px;
            border-radius: 100px;
        }

        /* ── Footer Navigation & Progress ── */
        .footer-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            background: var(--bg-surface, #121215);
            border-top: 1px solid var(--border, #222226);
            font-size: 10.5px;
            color: var(--text-secondary, #9ca3af);
            gap: 6px;
        }

        .progress-track {
            flex: 1;
            height: 4px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #38bdf8);
            transition: width 0.15s ease;
        }

        /* ── Script Editor Drawer ── */
        .script-drawer {
            position: absolute;
            inset: 28px 0 0 0;
            background: rgba(10, 10, 14, 0.98);
            z-index: 30;
            display: flex;
            flex-direction: column;
            padding: 10px 12px;
            gap: 8px;
        }

        .script-drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 600;
            color: #f3f4f6;
        }

        .script-textarea {
            flex: 1;
            width: 100%;
            background: #141419;
            border: 1px solid #2e2e38;
            border-radius: 8px;
            color: #f3f4f6;
            font-family: var(--font, sans-serif);
            font-size: 12.5px;
            line-height: 1.45;
            padding: 8px 10px;
            resize: none;
            outline: none;
            user-select: text;
            cursor: text;
        }

        .script-textarea:focus {
            border-color: #38bdf8;
        }

        .script-help {
            font-size: 10.5px;
            color: #9ca3af;
            line-height: 1.35;
        }
    `;

    static properties = {
        responses: { type: Array },
        selectedProfile: { type: String },
        onAnalyzeSlide: { type: Function },
        onExitEyeLock: { type: Function },
        _visualMode: { state: true }, // 'notch' | 'rsvp' | 'cards'
        _paceMode: { state: true }, // 'voice' | 'auto' | 'manual'
        _sourceMode: { state: true }, // 'script' | 'live'
        _wpm: { state: true },
        _isPlaying: { state: true },
        _isSpeaking: { state: true },
        _isDocked: { state: true },
        _showScriptEditor: { state: true },
        _rawScript: { state: true },
        _slides: { state: true },
        _slideIndex: { state: true },
        _chunkIndex: { state: true },
        _cardIndex: { state: true },
        _lastAiContent: { state: true },
    };

    constructor() {
        super();
        this.responses = [];
        this.selectedProfile = 'presentation';
        this.onAnalyzeSlide = () => {};
        this.onExitEyeLock = () => {};

        this._visualMode = 'notch';
        this._paceMode = 'voice';
        this._sourceMode = 'script';
        this._wpm = 128;
        this._isPlaying = false;
        this._isSpeaking = false;
        this._isDocked = false;
        this._showScriptEditor = false;

        this._rawScript = DEFAULT_PRESENTATION_SCRIPT;
        this._slides = parseScriptToSlides(this._rawScript, 3);
        this._slideIndex = 0;
        this._chunkIndex = 0;
        this._cardIndex = 0;
        this._savedScriptBookmark = { slideIndex: 0, chunkIndex: 0, cardIndex: 0 };
        this._lastAiContent = '';
        this._liveChunks = [];
        this._liveCards = [];
        this._isGeneratingAi = false;

        this._tickTimer = null;
        this._vadStream = null;
        this._vadAudioCtx = null;
        this._vadRaf = null;
        this._lastVoiceActiveAt = 0;

        this._loadPersistedState();
    }

    _loadPersistedState() {
        try {
            const savedScript = localStorage.getItem(STORAGE_KEY_SCRIPT);
            if (savedScript && savedScript.trim()) {
                this._rawScript = savedScript;
                this._slides = parseScriptToSlides(this._rawScript, 3);
            }
            const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                if (parsed.visualMode) this._visualMode = parsed.visualMode;
                if (parsed.paceMode) this._paceMode = parsed.paceMode;
                if (parsed.wpm) this._wpm = Number(parsed.wpm) || 128;
            }
        } catch (err) {
            console.warn('Could not load EyeLock state:', err);
        }
    }

    _saveSettings() {
        try {
            localStorage.setItem(
                STORAGE_KEY_SETTINGS,
                JSON.stringify({
                    visualMode: this._visualMode,
                    paceMode: this._paceMode,
                    wpm: this._wpm,
                })
            );
        } catch (err) {
            // ignore storage errors
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._boundKeydown = this._handleKeydown.bind(this);
        window.addEventListener('keydown', this._boundKeydown);

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            this._onIpcDown = () => this.stepForward();
            this._onIpcUp = () => this.stepBackward();
            this._onIpcNext = () => this.nextSlideOrBlock();
            this._onIpcPrev = () => this.prevSlideOrBlock();

            ipcRenderer.on('scroll-response-down', this._onIpcDown);
            ipcRenderer.on('scroll-response-up', this._onIpcUp);
            ipcRenderer.on('navigate-next-response', this._onIpcNext);
            ipcRenderer.on('navigate-previous-response', this._onIpcPrev);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopPacingEngine();
        this._stopVoiceVad();
        if (this._boundKeydown) {
            window.removeEventListener('keydown', this._boundKeydown);
        }
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            if (this._onIpcDown) ipcRenderer.removeListener('scroll-response-down', this._onIpcDown);
            if (this._onIpcUp) ipcRenderer.removeListener('scroll-response-up', this._onIpcUp);
            if (this._onIpcNext) ipcRenderer.removeListener('navigate-next-response', this._onIpcNext);
            if (this._onIpcPrev) ipcRenderer.removeListener('navigate-previous-response', this._onIpcPrev);
        }
    }

    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('responses')) {
            this._syncLatestAiResponse();
        }
    }

    _syncLatestAiResponse() {
        if (!Array.isArray(this.responses) || this.responses.length === 0) return;
        for (let i = this.responses.length - 1; i >= 0; i--) {
            const r = this.responses[i];
            const isAi = typeof r === 'string' || r?.type === 'ai';
            const content = typeof r === 'string' ? r : r?.content || '';
            if (isAi && content.trim()) {
                if (content !== this._lastAiContent) {
                    const isNewAnswer = !content.startsWith(this._lastAiContent) || !this._lastAiContent;
                    this._lastAiContent = content;
                    this._liveChunks = buildEyeConeChunks(content, 3);
                    this._liveCards = extractCueCards(content);

                    if (this._sourceMode !== 'live') {
                        this._savedScriptBookmark = {
                            slideIndex: this._slideIndex,
                            chunkIndex: this._chunkIndex,
                            cardIndex: this._cardIndex,
                        };
                        this._sourceMode = 'live';
                        this._chunkIndex = 0;
                        this._cardIndex = 0;
                    } else if (isNewAnswer) {
                        this._chunkIndex = 0;
                        this._cardIndex = 0;
                    }
                    this.requestUpdate();
                }
                break;
            }
        }
    }

    _handleKeydown(e) {
        if (this._showScriptEditor) return;
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePlay();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.stepForward();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            this.stepBackward();
        }
    }

    // ── Active Data Getters ──

    _getActiveChunks() {
        if (this._sourceMode === 'live') {
            return this._liveChunks.length > 0
                ? this._liveChunks
                : buildEyeConeChunks('Esperando pregunta o clic en **Explicar Slide** (Ctrl+Enter)...', 3);
        }
        const slide = this._slides[this._slideIndex] || this._slides[0];
        return slide ? slide.chunks : [];
    }

    _getActiveCards() {
        if (this._sourceMode === 'live') {
            return this._liveCards.length > 0
                ? this._liveCards
                : extractCueCards('Pulsa **Explicar Slide (Ctrl+Enter)** o escucha una pregunta en vivo para ver tus **Puntos Clave**.');
        }
        const slide = this._slides[this._slideIndex] || this._slides[0];
        return slide ? slide.cards : [];
    }

    // ── Pacing & Voice-Sync (VAD) Engine ──

    async togglePlay() {
        if (this._isPlaying) {
            this._isPlaying = false;
            this._stopPacingEngine();
            this._stopVoiceVad();
        } else {
            this._isPlaying = true;
            if (this._paceMode === 'voice') {
                await this._startVoiceVad();
            }
            this._scheduleNextStep();
        }
        this.requestUpdate();
    }

    async setPaceMode(mode) {
        this._paceMode = mode;
        this._saveSettings();
        if (this._isPlaying) {
            this._stopPacingEngine();
            this._stopVoiceVad();
            if (mode === 'voice') {
                await this._startVoiceVad();
            }
            if (mode !== 'manual') {
                this._scheduleNextStep();
            } else {
                this._isPlaying = false;
            }
        }
        this.requestUpdate();
    }

    setVisualMode(mode) {
        this._visualMode = mode;
        this._saveSettings();
        this.requestUpdate();
    }

    setSourceMode(mode) {
        if (mode === 'script' && this._sourceMode === 'live') {
            this._slideIndex = this._savedScriptBookmark.slideIndex || 0;
            this._chunkIndex = this._savedScriptBookmark.chunkIndex || 0;
            this._cardIndex = this._savedScriptBookmark.cardIndex || 0;
        }
        this._sourceMode = mode;
        this.requestUpdate();
    }

    adjustWpm(delta) {
        this._wpm = Math.max(75, Math.min(220, this._wpm + delta));
        this._saveSettings();
        this.requestUpdate();
    }

    async _startVoiceVad() {
        if (this._vadStream) return;
        try {
            this._vadStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this._vadAudioCtx = new AudioCtx();
            const source = this._vadAudioCtx.createMediaStreamSource(this._vadStream);
            const analyser = this._vadAudioCtx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.35;
            source.connect(analyser);

            const data = new Float32Array(analyser.fftSize);
            const VOICE_RMS_THRESHOLD = 0.016;
            const VOICE_HOLD_MS = 450;

            const sampleLoop = () => {
                if (!this._isPlaying || this._paceMode !== 'voice') return;
                analyser.getFloatTimeDomainData(data);
                let sumSq = 0;
                for (let i = 0; i < data.length; i++) {
                    sumSq += data[i] * data[i];
                }
                const rms = Math.sqrt(sumSq / data.length);
                const now = performance.now();

                if (rms >= VOICE_RMS_THRESHOLD) {
                    this._lastVoiceActiveAt = now;
                }
                const speakingNow = now - this._lastVoiceActiveAt < VOICE_HOLD_MS;
                if (this._isSpeaking !== speakingNow) {
                    this._isSpeaking = speakingNow;
                    this.requestUpdate();
                }
                this._vadRaf = requestAnimationFrame(sampleLoop);
            };

            this._vadRaf = requestAnimationFrame(sampleLoop);
        } catch (err) {
            console.warn('Microphone VAD unavailable, falling back to Auto-WPM:', err);
            this._paceMode = 'auto';
        }
    }

    _stopVoiceVad() {
        if (this._vadRaf) {
            cancelAnimationFrame(this._vadRaf);
            this._vadRaf = null;
        }
        if (this._vadStream) {
            this._vadStream.getTracks().forEach(t => t.stop());
            this._vadStream = null;
        }
        if (this._vadAudioCtx) {
            this._vadAudioCtx.close().catch(() => {});
            this._vadAudioCtx = null;
        }
        this._isSpeaking = false;
    }

    _stopPacingEngine() {
        if (this._tickTimer) {
            clearTimeout(this._tickTimer);
            this._tickTimer = null;
        }
    }

    _scheduleNextStep() {
        this._stopPacingEngine();
        if (!this._isPlaying || this._paceMode === 'manual') return;

        // Calculate natural duration for current chunk/card
        let delayMs = 1200;
        const msPerWord = 60000 / Math.max(75, this._wpm);

        if (this._visualMode === 'cards') {
            const cards = this._getActiveCards();
            const currentCard = cards[this._cardIndex];
            const words = currentCard ? currentCard.wordCount : 10;
            delayMs = Math.max(1800, Math.round(words * msPerWord));
        } else {
            const chunks = this._getActiveChunks();
            const currentChunk = chunks[this._chunkIndex];
            const weight = currentChunk ? currentChunk.weight : 3;
            delayMs = Math.max(420, Math.round(weight * msPerWord));
        }

        // In Voice-Sync mode, check frequently so it freezes during silence and advances smoothly when speaking
        const pollMs = this._paceMode === 'voice' ? Math.min(240, delayMs) : delayMs;
        this._accumulatedVoiceMs = this._accumulatedVoiceMs || 0;

        this._tickTimer = setTimeout(() => {
            if (!this._isPlaying) return;

            if (this._paceMode === 'voice') {
                if (this._isSpeaking) {
                    this._accumulatedVoiceMs += pollMs;
                    if (this._accumulatedVoiceMs >= delayMs) {
                        this._accumulatedVoiceMs = 0;
                        this._advanceOneUnit();
                    }
                }
            } else if (this._paceMode === 'auto') {
                this._advanceOneUnit();
            }

            if (this._isPlaying) {
                this._scheduleNextStep();
            }
        }, pollMs);
    }

    _advanceOneUnit() {
        if (this._visualMode === 'cards') {
            const cards = this._getActiveCards();
            if (this._cardIndex < cards.length - 1) {
                this._cardIndex++;
            } else if (this._sourceMode === 'script' && this._slideIndex < this._slides.length - 1) {
                this._slideIndex++;
                this._cardIndex = 0;
                this._chunkIndex = 0;
            } else {
                this._isPlaying = false;
                this._stopPacingEngine();
                this._stopVoiceVad();
            }
        } else {
            const chunks = this._getActiveChunks();
            if (this._chunkIndex < chunks.length - 1) {
                this._chunkIndex++;
            } else if (this._sourceMode === 'script' && this._slideIndex < this._slides.length - 1) {
                this._slideIndex++;
                this._chunkIndex = 0;
                this._cardIndex = 0;
            } else {
                this._isPlaying = false;
                this._stopPacingEngine();
                this._stopVoiceVad();
            }
        }
        this.requestUpdate();
    }

    stepForward() {
        this._accumulatedVoiceMs = 0;
        if (this._visualMode === 'cards') {
            const cards = this._getActiveCards();
            if (this._cardIndex < cards.length - 1) {
                this._cardIndex++;
            } else if (this._sourceMode === 'script' && this._slideIndex < this._slides.length - 1) {
                this._slideIndex++;
                this._cardIndex = 0;
                this._chunkIndex = 0;
            }
        } else {
            const chunks = this._getActiveChunks();
            if (this._chunkIndex < chunks.length - 1) {
                this._chunkIndex++;
            } else if (this._sourceMode === 'script' && this._slideIndex < this._slides.length - 1) {
                this._slideIndex++;
                this._chunkIndex = 0;
                this._cardIndex = 0;
            }
        }
        this.requestUpdate();
    }

    stepBackward() {
        this._accumulatedVoiceMs = 0;
        if (this._visualMode === 'cards') {
            if (this._cardIndex > 0) {
                this._cardIndex--;
            } else if (this._sourceMode === 'script' && this._slideIndex > 0) {
                this._slideIndex--;
                const prevCards = this._getActiveCards();
                this._cardIndex = Math.max(0, prevCards.length - 1);
            }
        } else {
            if (this._chunkIndex > 0) {
                this._chunkIndex--;
            } else if (this._sourceMode === 'script' && this._slideIndex > 0) {
                this._slideIndex--;
                const prevChunks = this._getActiveChunks();
                this._chunkIndex = Math.max(0, prevChunks.length - 1);
            }
        }
        this.requestUpdate();
    }

    nextSlideOrBlock() {
        if (this._sourceMode === 'script' && this._slideIndex < this._slides.length - 1) {
            this._slideIndex++;
            this._chunkIndex = 0;
            this._cardIndex = 0;
            this.requestUpdate();
        }
    }

    prevSlideOrBlock() {
        if (this._sourceMode === 'script' && this._slideIndex > 0) {
            this._slideIndex--;
            this._chunkIndex = 0;
            this._cardIndex = 0;
            this.requestUpdate();
        }
    }

    async handleAnalyzeSlideStandalone() {
        if (this._isGeneratingAi) return;
        this._isGeneratingAi = true;
        this.requestUpdate();

        try {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                const cap = await ipcRenderer.invoke('window:capture-slide-base64');
                if (cap && cap.success && cap.data) {
                    const slidePrompt = `Deliver a natural, ready-to-speak presentation script (2-4 short sentences) for the slide or screen shown right now. Highlight **2-4 core phrases or numbers in bold** so the presenter can read it in a 0.5-second glance, and insert [PAUSE] between key ideas. Start directly with the spoken words in first person—zero meta-commentary.`;
                    await ipcRenderer.invoke('send-image-content', {
                        data: cap.data,
                        prompt: slidePrompt,
                    });
                }
            }
        } catch (err) {
            console.warn('Error analyzing slide:', err);
        } finally {
            this._isGeneratingAi = false;
            this.requestUpdate();
        }
    }

    async handleAskAiTopic(e) {
        if (e.key && e.key !== 'Enter') return;
        const input = this.shadowRoot.querySelector('#eyelockAiInput');
        if (!input || !input.value.trim() || this._isGeneratingAi) return;
        const topic = input.value.trim();
        input.value = '';
        this._isGeneratingAi = true;
        this.requestUpdate();

        try {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                const prompt = `[PRESENTATION TELEPROMPTER REQUEST]: Write a short, natural spoken presentation script (3-4 sentences) about: "${topic}". Put **2-4 key anchor phrases in bold** and insert [PAUSE] between major thoughts. Output ONLY the exact spoken words.`;
                await ipcRenderer.invoke('send-text-message', prompt);
            }
        } catch (err) {
            console.warn('Error sending AI presentation topic:', err);
        } finally {
            this._isGeneratingAi = false;
            this.requestUpdate();
        }
    }

    async toggleCameraDock() {
        this._isDocked = !this._isDocked;
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('window:set-eyelock-dock', {
                docked: this._isDocked,
                width: 410,
                height: 270,
            });
        }
        this.dispatchEvent(
            new CustomEvent('eyelock-dock-changed', {
                detail: { docked: this._isDocked },
                bubbles: true,
                composed: true,
            })
        );
        this.requestUpdate();
    }

    _handleScriptSave(e) {
        this._rawScript = e.target.value;
        this._slides = parseScriptToSlides(this._rawScript, 3);
        this._slideIndex = Math.min(this._slideIndex, Math.max(0, this._slides.length - 1));
        this._chunkIndex = 0;
        this._cardIndex = 0;
        try {
            localStorage.setItem(STORAGE_KEY_SCRIPT, this._rawScript);
        } catch (err) {
            // ignore
        }
        this.requestUpdate();
    }

    // ── Renderers for the 3 Anti-Eye-Scan Visual Modes ──

    _renderChunkWords(chunk) {
        if (!chunk) return '';
        if (chunk.isGazeCue) {
            return html`<span>${chunk.text}</span>`;
        }
        return chunk.words.map(
            (w, idx) => html`${idx > 0 ? ' ' : ''}<span class="${w.isBold ? 'anchor-word' : ''}">${w.text}</span>`
        );
    }

    _renderNotchMode() {
        const chunks = this._getActiveChunks();
        const prevChunk = this._chunkIndex > 0 ? chunks[this._chunkIndex - 1] : null;
        const activeChunk = chunks[this._chunkIndex] || { text: 'Listo para exponer', words: [], isGazeCue: false };
        const next1 = chunks[this._chunkIndex + 1] || null;
        const next2 = chunks[this._chunkIndex + 2] || null;

        return html`
            <div class="eye-cone-column">
                <div class="notch-focus-band">
                    <div class="notch-line prev">${prevChunk ? this._renderChunkWords(prevChunk) : '·'}</div>
                    <div class="notch-line active ${activeChunk.isGazeCue ? 'gaze-cue' : ''}">
                        ${this._renderChunkWords(activeChunk)}
                    </div>
                    ${next1 ? html`<div class="notch-line next-1">${this._renderChunkWords(next1)}</div>` : ''}
                    ${next2 ? html`<div class="notch-line next-2">${this._renderChunkWords(next2)}</div>` : ''}
                </div>
            </div>
        `;
    }

    _renderRsvpMode() {
        const chunks = this._getActiveChunks();
        const activeChunk = chunks[this._chunkIndex] || { text: 'Mirar aquí', words: [], isGazeCue: false };
        const nextChunk = chunks[this._chunkIndex + 1] || null;
        const orp = computeOrpSplit(activeChunk.text);

        return html`
            <div class="eye-cone-column">
                <div class="rsvp-box">
                    <div class="rsvp-crosshair-top"></div>
                    <div class="rsvp-word-row">
                        <span class="rsvp-left">${orp.left}</span>
                        <span class="rsvp-focal">${orp.focal}</span>
                        <span class="rsvp-right">${orp.right}</span>
                    </div>
                    <div class="rsvp-crosshair-bottom"></div>
                    <div class="rsvp-peripheral-preview">
                        ${nextChunk ? `Siguiente: ${nextChunk.text}` : 'Fin del bloque actual'}
                    </div>
                </div>
            </div>
        `;
    }

    _renderCardsMode() {
        const cards = this._getActiveCards();
        const activeCard = cards[this._cardIndex] || {
            anchors: ['Idea Clave'],
            takeaway: 'Carga tu guion o pulsa Explicar Slide (Ctrl+Enter).',
            gazeSeconds: 3,
        };

        return html`
            <div class="eye-cone-column">
                <div class="cue-card">
                    <div class="cue-anchors">
                        ${activeCard.anchors.map(a => html`<span class="cue-anchor-pill">${a}</span>`)}
                    </div>
                    <div class="cue-takeaway">${activeCard.takeaway}</div>
                    <div class="cue-gaze-prompt">
                        👁️ MIRA AL LENTE Y EXPÓN NATURAL (~${activeCard.gazeSeconds}s)
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        const chunks = this._getActiveChunks();
        const cards = this._getActiveCards();
        const totalUnits = this._visualMode === 'cards' ? Math.max(1, cards.length) : Math.max(1, chunks.length);
        const currentUnit = this._visualMode === 'cards' ? this._cardIndex + 1 : this._chunkIndex + 1;
        const progressPct = Math.min(100, Math.round((currentUnit / totalUnits) * 100));
        const currentSlide = this._slides[this._slideIndex] || { title: 'Slide 1' };

        const dotClass = !this._isPlaying
            ? 'paused'
            : this._paceMode === 'voice'
              ? this._isSpeaking
                  ? 'speaking'
                  : 'paused'
              : 'speaking';

        const statusLabel = !this._isPlaying
            ? 'PAUSADO (ESPACIO)'
            : this._paceMode === 'voice'
              ? this._isSpeaking
                  ? '🎙️ VOZ ACTIVA · AVANZANDO'
                  : '⏸️ SILENCIO · ESPERANDO TU VOZ'
              : `▶ AUTO ${this._wpm} WPM`;

        return html`
            <div class="studio-shell ${this._isDocked ? 'docked' : ''}">
                <!-- Standalone Sidenav Feature Header (hidden when docked under webcam) -->
                <div class="studio-header ${this._isDocked ? 'hidden' : ''}">
                    <div class="studio-title-group">
                        <div class="studio-title">
                            <span>Exposición · Teleprompter Ojos a Cámara</span>
                            <span class="studio-badge">ZERO-SACCADE</span>
                        </div>
                        <div class="studio-subtitle">
                            Prepara tu guion por diapositivas y acóplalo bajo tu webcam para exponer sin que tus ojos se muevan al leer.
                        </div>
                    </div>
                    <div class="toolbar-group">
                        <button
                            class="icon-btn"
                            @click=${() => {
                                this._showScriptEditor = !this._showScriptEditor;
                            }}
                        >
                            ${this._showScriptEditor ? '✖ Ver Teleprompter' : '✏️ Editar Guion (' + this._slides.length + ' Slides)'}
                        </button>
                        <button
                            class="icon-btn primary"
                            @click=${() => this.toggleCameraDock()}
                            title="Convertir ventana en franja ultra-estrecha pegada debajo de tu webcam"
                        >
                            📌 Modo Cámara (Acoplar Bajo Webcam)
                        </button>
                    </div>
                </div>

                <!-- Top Camera Eye-Line Target Reticle -->
                <div class="camera-axis-bar">
                    <button class="icon-btn ${this._isDocked ? 'docked' : ''}" @click=${() => this.toggleCameraDock()} title="Acoplar o desacoplar franja estrecha arriba al centro justo bajo tu webcam">
                        ${this._isDocked ? '↩ Salir de Cámara (Panel)' : '📌 Acoplar a Cámara'}
                    </button>

                    <div class="camera-target">
                        <span class="camera-lens-dot ${dotClass}"></span>
                        <span>EJE DE CÁMARA · ${statusLabel}</span>
                    </div>

                    <button class="icon-btn" @click=${() => { this._showScriptEditor = !this._showScriptEditor; }} title="Pegar o editar tu guion de exposición por diapositivas">
                        ${this._showScriptEditor ? '✖ Cerrar Guion' : '✏️ Guion'}
                    </button>
                </div>

            <!-- Control Strip -->
            <div class="toolbar">
                <!-- Content Source: Script vs Live AI -->
                <div class="toolbar-group">
                    <div class="seg-pill">
                        <button
                            class="seg-btn ${this._sourceMode === 'script' ? 'active' : ''}"
                            @click=${() => this.setSourceMode('script')}
                            title="Usar tu guion preparado por diapositivas"
                        >
                            📜 Guion (${this._slideIndex + 1}/${this._slides.length})
                        </button>
                        <button
                            class="seg-btn ${this._sourceMode === 'live' ? 'active-emerald' : ''}"
                            @click=${() => this.setSourceMode('live')}
                            title="Respuestas en tiempo real de la IA (preguntas o pantalla)"
                        >
                            ⚡ IA Vivo
                        </button>
                    </div>
                </div>

                <!-- 3 Visual Anti-Eye-Scan Modes -->
                <div class="toolbar-group">
                    <div class="seg-pill">
                        <button
                            class="seg-btn ${this._visualMode === 'notch' ? 'active' : ''}"
                            @click=${() => this.setVisualMode('notch')}
                            title="Franja Camera-Notch: 3-4 palabras bajo la cámara (<3° ángulo ocular)"
                        >
                            Notch
                        </button>
                        <button
                            class="seg-btn ${this._visualMode === 'rsvp' ? 'active' : ''}"
                            @click=${() => this.setVisualMode('rsvp')}
                            title="Punto Focal Fijo: 0% movimiento de pupila"
                        >
                            Focal RSVP
                        </button>
                        <button
                            class="seg-btn ${this._visualMode === 'cards' ? 'active' : ''}"
                            @click=${() => this.setVisualMode('cards')}
                            title="Tarjetas de 1 vistazo de 0.5s con palabras ancla"
                        >
                            Cards
                        </button>
                    </div>
                </div>

                <!-- 3 Pacing Modes + WPM + Play -->
                <div class="toolbar-group">
                    <div class="seg-pill">
                        <button
                            class="seg-btn ${this._paceMode === 'voice' ? 'active-emerald' : ''}"
                            @click=${() => this.setPaceMode('voice')}
                            title="Sincronizado con tu voz: avanza solo cuando hablas por el micrófono"
                        >
                            🎙️ Voz
                        </button>
                        <button
                            class="seg-btn ${this._paceMode === 'auto' ? 'active' : ''}"
                            @click=${() => this.setPaceMode('auto')}
                            title="Avance continuo a velocidad WPM constante"
                        >
                            ⏱️ Auto
                        </button>
                        <button
                            class="seg-btn ${this._paceMode === 'manual' ? 'active' : ''}"
                            @click=${() => this.setPaceMode('manual')}
                            title="Avance manual con flechas o Ctrl+Shift+Down"
                        >
                            ⌨️ Manual
                        </button>
                    </div>

                    <div class="wpm-control" title="Velocidad en palabras por minuto">
                        <button class="wpm-step" @click=${() => this.adjustWpm(-10)}>-</button>
                        <span>${this._wpm}</span>
                        <button class="wpm-step" @click=${() => this.adjustWpm(10)}>+</button>
                    </div>

                    <button class="icon-btn primary" @click=${() => this.togglePlay()} title="Iniciar/Pausar avance (Espacio)">
                        ${this._isPlaying ? '⏸' : '▶'}
                    </button>

                    <button
                        class="icon-btn"
                        @click=${() => this.handleAnalyzeSlideStandalone()}
                        title="Capturar y explicar la diapositiva actual en tu pantalla con IA"
                    >
                        ${this._isGeneratingAi ? '⏳ IA...' : '📸 Slide IA'}
                    </button>
                </div>
            </div>

            <!-- Optical Teleprompter Viewport -->
            <div class="optical-stage">
                ${this._visualMode === 'notch'
                    ? this._renderNotchMode()
                    : this._visualMode === 'rsvp'
                      ? this._renderRsvpMode()
                      : this._renderCardsMode()}
            </div>

            <!-- Footer Slide & Chunk Navigation -->
            <div class="footer-bar">
                <div class="toolbar-group">
                    ${this._sourceMode === 'script'
                        ? html`
                              <button class="icon-btn" @click=${() => this.prevSlideOrBlock()} title="Slide anterior (Ctrl+[)">◀</button>
                              <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                  ${currentSlide.title}
                              </span>
                              <button class="icon-btn" @click=${() => this.nextSlideOrBlock()} title="Siguiente slide (Ctrl+])">▶</button>
                          `
                        : html`
                              <button class="icon-btn" @click=${() => this.setSourceMode('script')} title="Regresar al punto exacto donde pausaste tu guion">
                                  ↩ Volver a mi Guion
                              </button>
                          `}
                </div>

                <div class="progress-track">
                    <div class="progress-fill" style="width: ${progressPct}%"></div>
                </div>

                <div class="toolbar-group">
                    <button class="icon-btn" @click=${() => this.stepBackward()} title="Frase anterior (Flecha Arriba / Ctrl+Shift+Up)">↑</button>
                    <span style="font-family: var(--font-mono, monospace);">${currentUnit}/${totalUnits}</span>
                    <button class="icon-btn" @click=${() => this.stepForward()} title="Siguiente frase (Flecha Abajo / Ctrl+Shift+Down)">↓</button>
                </div>
            </div>

            <!-- Standalone Quick AI Presentation Generator Bar (hidden when docked compact) -->
            ${!this._isDocked
                ? html`
                      <div class="footer-bar" style="padding: 6px 12px; background: var(--bg-app, #0a0a0c);">
                          <input
                              id="eyelockAiInput"
                              type="text"
                              placeholder="✨ Pide a la IA un guion para exponer un tema o responder una pregunta del público (Enter)..."
                              style="flex: 1; background: var(--bg-elevated, #19191d); border: 1px solid var(--border, #2a2a30); border-radius: 6px; color: var(--text-primary, #f5f5f5); font-size: 11.5px; padding: 5px 10px; outline: none;"
                              @keydown=${e => this.handleAskAiTopic(e)}
                          />
                          <button class="icon-btn primary" @click=${() => this.handleAskAiTopic({})}>
                              ${this._isGeneratingAi ? '⏳ Generando...' : '✨ Generar Guion IA'}
                          </button>
                      </div>
                  `
                : ''}

            <!-- Collapsible Script Editor Drawer -->
            ${this._showScriptEditor
                ? html`
                      <div class="script-drawer">
                          <div class="script-drawer-header">
                              <span>📜 Guion de Exposición por Diapositivas</span>
                              <div class="toolbar-group">
                                  <button
                                      class="icon-btn"
                                      @click=${() => {
                                          this._rawScript = DEFAULT_PRESENTATION_SCRIPT;
                                          this._slides = parseScriptToSlides(this._rawScript, 3);
                                          this._slideIndex = 0;
                                          this._chunkIndex = 0;
                                          this._cardIndex = 0;
                                          localStorage.setItem(STORAGE_KEY_SCRIPT, this._rawScript);
                                      }}
                                  >
                                      Restaurar Ejemplo
                                  </button>
                                  <button class="icon-btn primary" @click=${() => { this._showScriptEditor = false; }}>
                                      ✔ Listo para Exponer
                                  </button>
                              </div>
                          </div>
                          <textarea
                              class="script-textarea"
                              .value=${this._rawScript}
                              @input=${e => this._handleScriptSave(e)}
                              placeholder="Escribe o pega tu exposición aquí. Usa --- para separar diapositivas, **negritas** para palabras ancla y [PAUSE] para pausas de contacto visual..."
                          ></textarea>
                          <div class="script-help">
                              💡 <strong>Tip Ojos a Cámara:</strong> Separa tus diapositivas con <code>---</code>, pon en <code>**negrita**</code> las 2-3 palabras clave de cada idea y escribe <code>[PAUSE]</code> donde quieras un recordatorio para mirar al lente.
                          </div>
                      </div>
                  `
                : ''}
            </div>
        `;
    }
}

customElements.define('eyelock-prompter', EyeLockPrompter);
