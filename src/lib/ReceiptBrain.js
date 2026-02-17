/**
 * ReceiptBrain - A lightweight Neural Network / Heuristic Engine for Receipt Parsing
 * 
 * This "Brain" simulates a set of neurons that evaluate each line of text 
 * to determine the probability of it being the "Total Amount".
 * 
 * It uses a Perceptron-like scoring model where each feature has a weight.
 */

class ReceiptBrain {
    constructor() {
        // "Synaptic Weights" - Trained values that determine importance
        this.weights = {
            hasTotalKeyword: 50,    // High confidence if line says "Total"
            isCurrencyFormat: 20,   // Looks like money ($50.000)
            isLargestNumber: 30,    // Usually the total is the biggest number
            isBottomHalf: 10,       // Totals are usually at the bottom
            hasNegativeKeywords: -100 // "Subtotal", "Cambio", "Efectivo" might be misleading
        };
    }

    /**
     * Analyze text and return the most likely Total Amount
     * @param {string} text - Raw OCR text
     * @returns {number|null} - The detected amount or null
     */
    analyze(text) {
        if (!text) return null;

        // 1. Pre-process: Split into lines and normalize
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // 2. Extract potential candidates (numerical values)
        let candidates = [];

        // Find the largest number in the document for comparison
        let globalMax = 0;

        lines.forEach((line, index) => {
            const numbers = this.extractNumbers(line);
            numbers.forEach(num => {
                if (num > globalMax && num < 100000000) globalMax = num; // Cap at 100M to avoid phone numbers/dates

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

        // 3. Neural Evaluation (Scoring)
        candidates = candidates.map(candidate => {
            let score = 0;

            // Feature 1: Keyword Proximity
            if (this.hasKeyword(candidate.normalizedLine, ['total', 'pagar', 'suma', 'neto', 'venta', 'importe'])) {
                score += this.weights.hasTotalKeyword;
            }

            // Feature 2: Negative Keywords (Inhibition)
            // "Subtotal" is often close to Total but is NOT the total.
            // "Cambio" (Change) or "Efectivo" (Cash) are also distractions.
            if (this.hasKeyword(candidate.normalizedLine, ['subtotal', 'sub-total', 'cambio', 'vuelto', 'efectivo', 'recibido'])) {
                score += this.weights.hasNegativeKeywords;
            }

            // Feature 3: Currency Format
            // Does the line contain symbols like '$' or strict formatting?
            if (candidate.lineText.includes('$') || /[\d]{1,3}[.,][\d]{3}/.test(candidate.lineText)) {
                score += this.weights.isCurrencyFormat;
            }

            // Feature 4: Largest Number (Winner takes all usually)
            if (candidate.value === globalMax) {
                score += this.weights.isLargestNumber;
            }

            // Feature 5: Position (Bottom 50% of lines)
            const relativePosition = candidate.lineIndex / lines.length;
            if (relativePosition > 0.5) {
                score += this.weights.isBottomHalf;
            }

            return { ...candidate, score };
        });

        // 4. Activation / Selection
        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        const winner = candidates[0];

        console.log("ReceiptBrain Analysis:", candidates.slice(0, 3)); // Debug top 3

        // Threshold: If score is too low, we might not be sure.
        // But for now, we'll return the winner if it exists.
        return winner.value;
    }

    /**
     * Extract numbers from a string, handling formatting (1.000 vs 1,000)
     */
    extractNumbers(text) {
        // Match sequences of digits, dots, commas
        const matches = text.match(/[\d,.]+/g);
        if (!matches) return [];

        return matches.map(raw => {
            // Heuristic for Colombia/Latam:
            // If text contains '$', usually dot is thousands.
            // Simplified cleanup: remove non-digits.
            // E.g. "50.000" -> 50000. "12,500.00" -> 1250000 (Risk!)

            // Better heuristic:
            // Remove all characters that are NOT digits.
            // Interpret as integer.
            const clean = raw.replace(/[^\d]/g, '');
            const val = parseFloat(clean);
            return isNaN(val) ? 0 : val;
        }).filter(v => v > 0);
    }

    hasKeyword(text, keywords) {
        return keywords.some(k => text.includes(k));
    }
}

export const receiptBrain = new ReceiptBrain();
