import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2, X, Check } from 'lucide-react';

const ReceiptScanner = ({ onScanComplete, onClose }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
            setError(null);
            processImage(imageUrl);
        }
    };

    const processImage = async (imageUrl) => {
        setScanning(true);
        setProgress(0);
        setError(null);

        try {
            const result = await Tesseract.recognize(
                imageUrl,
                'spa', // Spanish language for better accuracy with local receipts
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            console.log("Scanned text:", text);
            const amount = extractAmount(text);

            if (amount) {
                onScanComplete(amount);
            } else {
                setError("No se pudo detectar un monto total claro. Intenta ingresar el valor manualmente.");
            }

        } catch (err) {
            console.error("OCR Error:", err);
            setError("Ocurrió un error al escanear la imagen.");
        } finally {
            setScanning(false);
        }
    };

    const extractAmount = (text) => {
        // Cleaning and sanitizing lines
        const lines = text.split('\n').map(line => line.trim().toLowerCase());

        let foundAmount = null;

        // Keywords that usually precede the total amount
        const totalKeywords = ['total', 'pagar', 'suma', 'neto', 'venta', 'importe'];

        // Regex to find currency amounts
        // Looking for patterns like: $ 50.000, 50.000, 12,345.67
        // We need to be careful with dots and commas as they vary by region.
        // In this context (Latam/Colombia), usually dots are thousands, inputs expect raw numbers.

        for (let line of lines) {
            // specific logic to find the line with "Total"
            const hasKeyword = totalKeywords.some(keyword => line.includes(keyword));

            if (hasKeyword) {
                // Try to extract the number from this line
                const numbers = line.match(/[\d,.]+/g);
                if (numbers) {
                    // Get the last number in the line (usually the amount)
                    const lastNum = numbers[numbers.length - 1];

                    // Clean up: remove non-numeric except dot/comma
                    // Simplistic assumption: remove all non-digits to get raw integer for COP
                    // e.g. 50.000 -> 50000
                    const raw = lastNum.replace(/[^\d]/g, '');
                    const val = parseFloat(raw);

                    if (!isNaN(val) && val > 0) {
                        foundAmount = val;
                        // We found a likely candidate on the Total line
                        break;
                    }
                }
            }
        }

        // Return found amount
        if (foundAmount) return foundAmount;

        return null;
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">

            {!image && (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/20 border-dashed rounded-xl cursor-pointer hover:bg-white/5 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                        <Camera className="w-8 h-8 text-[color:var(--accent-purple)] mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-xs text-gray-400">Escanear Recibo</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                    />
                </label>
            )}

            {image && (
                <div className="w-full space-y-3">
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black/40">
                        <img src={image} alt="Preview" className={`w-full h-full object-contain ${scanning ? 'opacity-50 blur-sm' : ''}`} />

                        {scanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 text-[color:var(--accent-purple)] animate-spin mb-2" />
                                <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
                                    Procesando... {progress}%
                                </span>
                            </div>
                        )}

                        {error && !scanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-2 text-center">
                                <X className="w-6 h-6 text-red-500 mb-1" />
                                <p className="text-xs text-red-300 leading-tight">{error}</p>
                                <button
                                    onClick={() => setImage(null)}
                                    className="mt-2 text-[10px] bg-white/10 px-2 py-1 rounded text-white hover:bg-white/20"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                        {!error && !scanning && (
                            <div className="absolute top-2 right-2">
                                <div className="bg-green-500 rounded-full p-1 shadow-lg">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    {!scanning && (
                        <button
                            onClick={() => setImage(null)}
                            className="w-full py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            Usar otra imagen
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReceiptScanner;
