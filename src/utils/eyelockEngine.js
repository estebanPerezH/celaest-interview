// eyelockEngine.js — Pure Zero-Saccade Eye-Lock parsing, chunking, ORP & Cue-Card engine

export const DEFAULT_PRESENTATION_SCRIPT = `# Slide 1: Hook & Core Problem
Today I want to walk you through **our core architecture** and the **real business problem** we solved. [PAUSE]
In traditional workflows, teams lose **over 40% of their time** fixing flaky tests and manual bottlenecks.
---
# Slide 2: Solution & Architecture
To solve this, we designed a **resilient zero-downtime pipeline** focused on **speed and reliability**. [PAUSE]
Every service runs with **automated quality gates** and **real-time observability** from day one.
---
# Slide 3: Impact & Results
As a result, deployment cycles dropped from **two days to 15 minutes** with **99.9% stability**. [PAUSE]
I'd love to open the floor for **your questions** or dive deeper into any part of the diagram.`;

const BASIC_STOPWORDS = new Set([
    'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between',
    'could', 'every', 'first', 'from', 'have', 'into', 'other', 'our', 'should',
    'their', 'there', 'these', 'thing', 'think', 'this', 'those', 'through',
    'under', 'using', 'what', 'when', 'where', 'which', 'while', 'with', 'would',
    'your', 'para', 'como', 'este', 'esta', 'estos', 'pero', 'porque', 'sobre',
    'entre', 'desde', 'hasta', 'donde', 'cuando', 'todo', 'todos',
]);

/**
 * Strips markdown formatting symbols while keeping readable text.
 */
export function stripMarkdownInline(text = '') {
    return String(text)
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/^#+\s*/gm, '')
        .trim();
}

/**
 * Splits a text block into narrow 3-word optical chunks (<3 deg horizontal eye angle)
 * while preserving bold anchor metadata and inserting camera-gaze pause cues.
 */
export function buildEyeConeChunks(rawText = '', maxWordsPerChunk = 3) {
    const cleaned = String(rawText || '')
        .replace(/^#+\s+.*$/gm, '')
        .replace(/\r\n/g, '\n')
        .trim();

    if (!cleaned) return [];

    // Normalize explicit pause markers into standalone tokens
    const normalized = cleaned.replace(/\[(?:PAUSE|PAUSA|MIRAR|CAMERA|CAMARA)\]/gi, ' [[EYE_PAUSE]] ');

    // Parse bold spans vs normal words
    const segments = normalized.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    const wordTokens = [];

    for (const seg of segments) {
        const isBoldSeg = seg.startsWith('**') && seg.endsWith('**') && seg.length > 4;
        const inner = isBoldSeg ? seg.slice(2, -2) : seg;
        const parts = inner.split(/\s+/).filter(Boolean);
        for (const p of parts) {
            if (p === '[[EYE_PAUSE]]') {
                wordTokens.push({ text: p, isBold: false, isPauseToken: true });
            } else {
                wordTokens.push({ text: p, isBold: isBoldSeg, isPauseToken: false });
            }
        }
    }

    const chunks = [];
    let currentWords = [];

    const flushCurrent = (extraPause = false) => {
        if (currentWords.length === 0) return;
        const plainText = currentWords.map(w => w.text).join(' ');
        const hasBold = currentWords.some(w => w.isBold);
        const endsSentence = /[.!?;:]$/.test(plainText);
        const wordCount = currentWords.length;
        chunks.push({
            id: `chunk-${chunks.length}`,
            index: chunks.length,
            words: currentWords,
            text: plainText,
            hasBold,
            isGazeCue: false,
            wordCount,
            weight: wordCount + (endsSentence ? 0.65 : 0) + (extraPause ? 0.85 : 0),
        });
        currentWords = [];
    };

    for (const tok of wordTokens) {
        if (tok.isPauseToken) {
            flushCurrent(true);
            chunks.push({
                id: `chunk-${chunks.length}`,
                index: chunks.length,
                words: [],
                text: '👁️ MIRA AL LENTE · PAUSA NATURAL',
                hasBold: true,
                isGazeCue: true,
                wordCount: 2,
                weight: 2.2,
            });
            continue;
        }

        currentWords.push(tok);
        const endsClause = /[.!?;:,]$/.test(tok.text);

        if (currentWords.length >= maxWordsPerChunk || (endsClause && currentWords.length >= 2)) {
            flushCurrent(false);
        }
    }

    flushCurrent(false);
    return chunks;
}

/**
 * Computes Optimal Recognition Point (ORP) split for zero-pupil-movement RSVP mode.
 * Returns { left, focal, right } so the focal character stays locked at the center camera axis.
 */
export function computeOrpSplit(chunkText = '') {
    const clean = stripMarkdownInline(chunkText).replace(/\s+/g, ' ').trim();
    if (!clean) {
        return { left: '', focal: '●', right: '' };
    }
    const len = clean.length;
    const focalIndex = Math.max(0, Math.min(len - 1, Math.floor((len - 1) * 0.44)));
    return {
        left: clean.slice(0, focalIndex),
        focal: clean.charAt(focalIndex),
        right: clean.slice(focalIndex + 1),
    };
}

/**
 * Extracts Glance Cue-Cards (0.5s visual glance cards with 2-4 giant anchor badges
 * and spoken takeaway) from a slide or live AI response.
 */
export function extractCueCards(rawText = '') {
    const cleaned = String(rawText || '')
        .replace(/^#+\s+.*$/gm, '')
        .replace(/\r\n/g, '\n')
        .trim();

    if (!cleaned) return [];

    // Split by explicit [PAUSE] markers, double newlines, or bullet lines
    const rawBlocks = cleaned
        .split(/\[(?:PAUSE|PAUSA|MIRAR|CAMERA|CAMARA)\]|\n{2,}|\n(?=[-•*]\s)/i)
        .map(b => b.replace(/^[-•*]\s+/, '').trim())
        .filter(Boolean);

    // If a block is very long (> 38 words), split it into 2-sentence cards
    const blocks = [];
    for (const b of rawBlocks) {
        const words = b.split(/\s+/);
        if (words.length > 38) {
            const sentences = b.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [b];
            let acc = '';
            for (const s of sentences) {
                if ((acc + ' ' + s).trim().split(/\s+/).length > 28 && acc.trim()) {
                    blocks.push(acc.trim());
                    acc = s;
                } else {
                    acc = (acc + ' ' + s).trim();
                }
            }
            if (acc.trim()) blocks.push(acc.trim());
        } else {
            blocks.push(b);
        }
    }

    return blocks.map((block, idx) => {
        // 1. Extract explicit **bold** phrases first
        const boldMatches = [];
        const regex = /\*\*([^*]+)\*\*/g;
        let match;
        while ((match = regex.exec(block)) !== null) {
            const phrase = match[1].trim();
            if (phrase && !boldMatches.includes(phrase)) {
                boldMatches.push(phrase);
            }
        }

        // 2. Fallback: extract numbers/metrics or high-signal words ONLY if no explicit bold anchors exist
        if (boldMatches.length === 0) {
            const plainWords = stripMarkdownInline(block).split(/\s+/);
            for (const w of plainWords) {
                const cleanW = w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9%]+$/g, '');
                if (!cleanW) continue;
                const isMetric = /\d/.test(cleanW);
                const isKeyword = cleanW.length >= 6 && !BASIC_STOPWORDS.has(cleanW.toLowerCase());
                if ((isMetric || isKeyword) && !boldMatches.some(b => b.toLowerCase().includes(cleanW.toLowerCase()))) {
                    boldMatches.push(cleanW);
                }
                if (boldMatches.length >= 3) break;
            }
        }

        const plainTakeaway = stripMarkdownInline(block);
        const wordCount = plainTakeaway.split(/\s+/).filter(Boolean).length;
        const gazeSeconds = Math.max(3, Math.round((wordCount / 130) * 60));

        return {
            id: `card-${idx}`,
            index: idx,
            anchors: boldMatches.slice(0, 4),
            rawMarkdown: block,
            takeaway: plainTakeaway,
            wordCount,
            gazeSeconds,
        };
    });
}

/**
 * Parses a full presentation script into structured slides/sections.
 */
export function parseScriptToSlides(rawScript = '', maxWordsPerChunk = 3) {
    const source = String(rawScript || '').trim() || DEFAULT_PRESENTATION_SCRIPT;
    const rawSections = source
        .split(/\n\s*---+\s*\n/g)
        .map(s => s.trim())
        .filter(Boolean);

    return rawSections.map((section, idx) => {
        const lines = section.split('\n');
        let title = `Slide ${idx + 1}`;
        let bodyLines = lines;

        if (lines[0] && /^#+\s+/.test(lines[0])) {
            title = lines[0].replace(/^#+\s+/, '').trim();
            bodyLines = lines.slice(1);
        } else if (lines[0] && /^slide\s+\d+\s*:/i.test(lines[0])) {
            title = lines[0].trim();
            bodyLines = lines.slice(1);
        }

        const body = bodyLines.join('\n').trim() || section;
        const chunks = buildEyeConeChunks(body, maxWordsPerChunk);
        const cards = extractCueCards(body);
        const wordCount = stripMarkdownInline(body).split(/\s+/).filter(Boolean).length;

        return {
            id: `slide-${idx}`,
            index: idx,
            title,
            body,
            chunks,
            cards,
            wordCount,
            estimatedSeconds: Math.max(4, Math.round((wordCount / 130) * 60)),
        };
    });
}
