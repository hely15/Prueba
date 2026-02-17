import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2, X, Check, RefreshCw, Zap, Image as ImageIcon } from 'lucide-react';
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

            // Calculate new dimensions (max width 1500px for better OCR accuracy)
            const MAX_WIDTH = 1500;
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

            // Grayscale conversion
            const fullImageData = ctx.getImageData(0, 0, width, height);
            const data = fullImageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;     // red
                data[i + 1] = avg; // green
                data[i + 2] = avg; // blue
            }
            ctx.putImageData(fullImageData, 0, 0);

            // Get processed image as data URL
            const processedImageUrl = canvas.toDataURL('image/jpeg', 0.9);

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
                'spa',
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
                if (navigator.vibrate) navigator.vibrate(200);
                // Pass back both amount AND raw text for training
                onScanComplete(amount, text);
            } else {
                setError("No se pudo detectar un monto total claro. Intenta tomar la foto más de cerca.");
            }

        } catch (err) {
            console.error("OCR Error:", err);
            setError("Ocurrió un error al escanear la imagen.");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 mb-4 animate-fade-in">

            {!image && (
                <div className="w-full grid grid-cols-2 gap-4">
                    <label className="flex flex-col items-center justify-center h-32 bg-white/5 border-2 border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/10 transition-all group active:scale-95">
                        <Camera className="w-8 h-8 text-[color:var(--accent-purple)] mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium text-white">Tomar Foto</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageChange}
                        />
                    </label>

                    <label className="flex flex-col items-center justify-center h-32 bg-white/5 border-2 border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/10 transition-all group active:scale-95">
                        <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium text-white">Subir Imagen</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </label>
                </div>
            )}

            {image && (
                <div className="w-full relative rounded-xl overflow-hidden bg-black/40 border border-white/10">
                    <img src={image} alt="Preview" className={`w-full max-h-[300px] object-contain ${scanning ? 'opacity-50 blur-sm' : ''}`} />

                    {scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <Loader2 className="w-10 h-10 text-[color:var(--accent-purple)] animate-spin mb-3" />
                            <span className="text-white font-bold text-sm drop-shadow-md">
                                Analizando Factura... {progress}%
                            </span>
                            <div className="w-48 h-1 bg-gray-700 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-[color:var(--accent-purple)] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {error && !scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center z-10">
                            <X className="w-10 h-10 text-red-500 mb-2" />
                            <p className="text-sm text-white font-medium mb-4">{error}</p>
                            <button
                                onClick={() => setImage(null)}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}

                    {!scanning && !error && (
                        <button
                            onClick={() => setImage(null)}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            )}

            <p className="text-[10px] text-gray-500 mt-2 text-center w-full">
                Usa una foto clara y bien iluminada para mejor precisión.
            </p>
        </div>
    );
};

export default ReceiptScanner;
