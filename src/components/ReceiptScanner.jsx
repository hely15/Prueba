import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2, X, Check } from 'lucide-react';
import { receiptBrain } from '../lib/ReceiptBrain';

const ReceiptScanner = ({ onScanComplete, onClose }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create a preview immediately
            const objectUrl = URL.createObjectURL(file);
            setImage(objectUrl);
            setError(null);

            // Start optimization and processing
            optimizeAndProcessImage(file);
        }
    };

    const optimizeAndProcessImage = (file) => {
        setScanning(true);
        setProgress(0);
        setError(null);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate new dimensions (max width 800px)
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image on canvas (this resizes it)
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to grayscale for better OCR accuracy (optional but recommended)
            const fullImageData = ctx.getImageData(0, 0, width, height);
            const data = fullImageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;     // red
                data[i + 1] = avg; // green
                data[i + 2] = avg; // blue
            }
            ctx.putImageData(fullImageData, 0, 0);

            // Get processed image as data URL or Blob
            // Tesseract accepts the canvas element directly or a data URL
            const processedImageUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Start OCR
            processImage(processedImageUrl);
        };
        img.onerror = () => {
            setError("Error al procesar la imagen.");
            setScanning(false);
        };
        img.src = URL.createObjectURL(file);
    };

    const processImage = async (imageUrl) => {
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
            // Use ReceiptBrain to analyze the text
            const amount = receiptBrain.analyze(text);

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

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">

            {!image && (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/20 border-dashed rounded-xl cursor-pointer hover:bg-white/5 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                        <Camera className="w-8 h-8 text-[color:var(--accent-purple)] mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-xs text-gray-400">Escanear Recibo (AI)</p>
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
