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
            hasTotalKeyword: 60,    // Increased confidence for explicit "Total"
            hasArticlesKeyword: 40, // "Articulos" (items) usually implies a sum nearby
            isCurrencyFormat: 20,   // Looks like money ($50.000)
            isLargestNumber: 25,    // Usually the total is the biggest number
            isBottomHalf: 15,       // Totals are usually at the bottom
            hasNegativeKeywords: -200, // HEAVY penalty for taxes (IVA, Impoconsumo)
            isBlackLine: 30         // Simulating "underlined in black" (we can't see color but we can look for "====" or "____" lines nearby)
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
            const text = candidate.normalizedLine;

            // Feature 1: Keyword Proximity (Positive)
            if (this.hasKeyword(text, ['total', 'pagar', 'suma', 'neto', 'venta', 'importe', 'monto'])) {
                score += this.weights.hasTotalKeyword;
            }

            // Feature 1b: "Articulos" support
            if (this.hasKeyword(text, ['articulos', 'items', 'productos'])) {
                score += this.weights.hasArticlesKeyword;
            }

            // Feature 2: Negative Keywords (Inhibition) - CRITICAL UPDATE
            // Explicitly avoid taxes, change, cash given, subtotal
            if (this.hasKeyword(text, ['iva', 'impuesto', 'impoconsumo', 'tax', 'subtotal', 'sub-total', 'base', 'cambio', 'vuelto', 'efectivo', 'recibido', 'tarjeta', 'ahorro'])) {

                // Exception: If it says "Total IVA" or "Total Impuestos", it's still bad.
                // But if it says "Total a Pagar", it's good.
                // If the line implies it IS a tax, kill the score.
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

            // Feature 6: "Underline" heuristic
            // If the PREVIOUS line was "=======" or "_______", this line is likely important.
            if (candidate.lineIndex > 0) {
                const prevLine = lines[candidate.lineIndex - 1];
                if (/[-=_]{3,}/.test(prevLine)) {
                    score += this.weights.isBlackLine;
                }
            }

            return { ...candidate, score };
        });

        // 4. Activation / Selection
        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        const winner = candidates[0];

        console.log("ReceiptBrain Analysis (Top 3):", candidates.slice(0, 3));

        // If the winner has a very low score (because it was a tax line), we might want to return null.
        // But the weights are designed so that a "Total" line will almost always outscore a "Tax" line.
        if (winner.score < -50) return null; // Safety net for when everything is a tax

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
            // Cleanup: remove all non-digits.
            // In Colombia/files provided, 50.000 usually means 50000.
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
