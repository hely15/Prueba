/**
 * ReceiptBrain - A lightweight Neural Network / Heuristic Engine for Receipt Parsing
 * 
 * This "Brain" simulates a set of neurons that evaluate each line of text 
 * to determine the probability of it being the "Total Amount".
 * 
 * Features:
 * - Neural Scoring (Perceptron-like)
 * - Continuous Learning (Reinforcement Learning via localStorage)
 * - Auto-Optimization based on user feedback
 */

class ReceiptBrain {
    constructor() {
        // Base weights (The "DNA" of the brain)
        this.defaultWeights = {
            hasTotalKeyword: 60,
            hasArticlesKeyword: 40,
            isCurrencyFormat: 20,
            isLargestNumber: 50, // BOOSTED: User wants strict priority on largest value
            isBottomHalf: 15,
            hasNegativeKeywords: -200,
            isBlackLine: 30
        };

        // Load learned weights or use defaults
        this.weights = this.loadMemory();

        // Learned patterns (specific keywords that correlate with correct answers)
        this.learnedPatterns = this.loadPatterns();
    }

    loadMemory() {
        try {
            const saved = localStorage.getItem('receiptBrain_weights');
            return saved ? { ...this.defaultWeights, ...JSON.parse(saved) } : { ...this.defaultWeights };
        } catch (e) {
            return { ...this.defaultWeights };
        }
    }

    saveMemory() {
        try {
            localStorage.setItem('receiptBrain_weights', JSON.stringify(this.weights));
            localStorage.setItem('receiptBrain_patterns', JSON.stringify(this.learnedPatterns));
        } catch (e) {
            console.error("Failed to save brain memory", e);
        }
    }

    loadPatterns() {
        try {
            const saved = localStorage.getItem('receiptBrain_patterns');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Train the brain with the correct result
     * @param {string} fullText - The full OCR text
     * @param {number} correctAmount - The amount the user confirmed/entered
     */
    train(fullText, correctAmount) {
        if (!fullText || !correctAmount) return;

        console.log(`[ReceiptBrain] Training with correct amount: ${correctAmount}`);

        const lines = fullText.split('\n').map(l => l.trim().toLowerCase());

        // Find lines that contained the correct amount
        const correctLines = lines.filter(line => {
            const numbers = this.extractNumbers(line);
            return numbers.includes(correctAmount);
        });

        if (correctLines.length === 0) {
            console.log("[ReceiptBrain] Correct amount not found in text. Cannot learn pattern.");
            return;
        }

        // Reinforcement Learning: Strengthen keywords found in correct lines
        correctLines.forEach(line => {
            // Tokenize simple words (min 3 chars)
            const words = line.split(/[\s\d$.,:;-]+/).filter(w => w.length > 3);

            words.forEach(word => {
                // Ignore common stop words if needed, but for receipts "Total", "Neto" are good.
                if (!this.learnedPatterns[word]) {
                    this.learnedPatterns[word] = 0;
                }
                // Boost this word's score
                this.learnedPatterns[word] += 5;
            });

            // Adjust Global Weights based on features of the correct line
            if (line.includes('total')) this.weights.hasTotalKeyword += 1;

            // Check if it was the largest number in the whole text
            const allNumbers = this.extractNumbers(fullText);
            if (this.extractNumbers(line).includes(correctAmount) && Math.max(...allNumbers) === correctAmount) {
                this.weights.isLargestNumber += 1; // It was indeed the largest
            }
        });

        this.saveMemory();
        console.log("[ReceiptBrain] Learning complete. Updated weights:", this.weights);
    }

    /**
     * Analyze text and return the most likely Total Amount
     * @param {string} text - Raw OCR text
     * @returns {number|null} - The detected amount or null
     */
    analyze(text) {
        if (!text) return null;

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let candidates = [];
        let globalMax = 0;

        // 1. First Pass: Extraction & Global Max Calculation
        // We only consider numbers that pass strict extraction as candidates for "Max"
        lines.forEach((line) => {
            const numbers = this.extractNumbers(line);
            numbers.forEach(num => {
                if (num > globalMax && num < 100000000) globalMax = num;
            });
        });

        // 2. Second Pass: Candidate Creation
        lines.forEach((line, index) => {
            const numbers = this.extractNumbers(line);
            numbers.forEach(num => {
                candidates.push({
                    value: num,
                    lineText: line,
                    lineIndex: index,
                    normalizedLine: line.toLowerCase(),
                    score: 0
                });
            });
        });

        if (candidates.length === 0) return null;

        // 3. Third Pass: Neural Scoring
        candidates = candidates.map(candidate => {
            let score = 0;
            const text = candidate.normalizedLine;

            // Base Features
            if (this.hasKeyword(text, ['total', 'pagar', 'suma', 'neto', 'venta', 'importe', 'monto'])) {
                score += this.weights.hasTotalKeyword;
            }
            if (this.hasKeyword(text, ['articulos', 'items', 'productos'])) {
                score += this.weights.hasArticlesKeyword;
            }
            if (this.hasKeyword(text, ['iva', 'impuesto', 'impoconsumo', 'tax', 'subtotal', 'sub-total', 'base', 'cambio', 'vuelto', 'efectivo', 'recibido', 'tarjeta', 'ahorro'])) {
                score += this.weights.hasNegativeKeywords;
            }
            if (candidate.lineText.includes('$') || /[\d]{1,3}[.,][\d]{3}/.test(candidate.lineText)) {
                score += this.weights.isCurrencyFormat;
            }

            // Critical: If it is the largest detected number, give massive boost
            if (candidate.value === globalMax) {
                score += this.weights.isLargestNumber;
            }

            const relativePosition = candidate.lineIndex / lines.length;
            if (relativePosition > 0.5) {
                score += this.weights.isBottomHalf;
            }
            if (candidate.lineIndex > 0) {
                const prevLine = lines[candidate.lineIndex - 1];
                if (/[-=_]{3,}/.test(prevLine)) {
                    score += this.weights.isBlackLine;
                }
            }

            // Learned Pattern Boost
            const words = text.split(/[\s\d$.,:;-]+/).filter(w => w.length > 3);
            words.forEach(word => {
                if (this.learnedPatterns[word]) {
                    score += this.learnedPatterns[word];
                }
            });

            // Contextual Boost: Is it "isolated"? (Short line with just Text + Number is often Total)
            if (text.length < 20 && score > 0) {
                score += 10;
            }

            return { ...candidate, score };
        });

        // 4. Activation
        candidates.sort((a, b) => b.score - a.score);
        const winner = candidates[0];

        console.log("Brain Analysis Top:", winner);

        if (winner.score < -50) return null;

        return winner.value;
    }

    /**
     * Extract numbers from a string, handling formatting.
     * STRICT MODE: Must contain '.' or ',' to be considered a price.
     */
    extractNumbers(text) {
        // Match likely number patterns: digits, dots, commas
        const matches = text.match(/[\d,.]+/g);
        if (!matches) return [];

        return matches.map(raw => {
            // STRICT RULE: If it doesn't have a dot or comma, it's not a price (e.g. invalid)
            // User requirement: "si no tiene ninguna de estas dos no es l valor total"
            if (!raw.includes('.') && !raw.includes(',')) {
                return null;
            }

            // Heuristic for trailing zeros (cents)
            // If it ends in ,00 or .00, strip it first.
            let clean = raw;
            if (clean.endsWith(',00') || clean.endsWith('.00')) {
                clean = clean.slice(0, -3);
            }

            // Remove ALL non-digits (treats . and , as thousands separators)
            clean = clean.replace(/[^\d]/g, '');

            const val = parseFloat(clean);
            return isNaN(val) ? 0 : val;
        })
            .filter(v => v !== null && v > 0); // Filter out nulls (failed strict check) and zeros
    }

    /**
     * Check if text contains any of the keywords using Fuzzy Logic (Levenshtein)
     * Allows for small typos (e.g. "To1al" instead of "Total")
     */
    hasKeyword(text, keywords) {
        // 1. Fast path: exact match
        if (keywords.some(k => text.includes(k))) return true;

        // 2. Fuzzy path: Check words against keywords
        const words = text.split(/[\s,.:;]+/);

        for (const word of words) {
            if (word.length < 4) continue; // Skip short words to avoid false positives

            for (const keyword of keywords) {
                // Only fuzzy match if lengths are similar
                if (Math.abs(word.length - keyword.length) > 2) continue;

                const dist = this.levenshtein(word, keyword);
                // Allow 1 error for short words, 2 for longer
                const maxEdits = keyword.length > 5 ? 2 : 1;

                if (dist <= maxEdits) return true;
            }
        }
        return false;
    }

    /**
     * Calculate Levenshtein Distance between two strings
     */
    levenshtein(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1 // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
}

export const receiptBrain = new ReceiptBrain();
