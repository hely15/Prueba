import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2, X, Check, RefreshCw } from 'lucide-react';
import { receiptBrain } from '../lib/ReceiptBrain';

const ReceiptScanner = ({ onScanComplete, onClose }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Initialize Camera
    const startCamera = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Back camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraActive(false);
        }
    };

    useEffect(() => {
        // Start camera on mount
        startCamera();
        return () => stopCamera();
    }, []);

    const captureAndProcess = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stopCamera(); // Stop query stream to save battery/resources

        // Prepare for processing
        const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
        optimizeAndProcessImage(imageUrl);
    };

    const optimizeAndProcessImage = (inputUrl) => {
        setScanning(true);
        setProgress(0);
        setError(null);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate new dimensions (max width 800px for speed)
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

            const processedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
            processImage(processedImageUrl);
        };
        img.src = inputUrl;
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

            const amount = receiptBrain.analyze(text);

            if (amount) {
                onScanComplete(amount);
            } else {
                setError("No encontré un total claro. Intenta acercar más el 'Total'.");
                setIsCameraActive(false); // Enable retry UI
            }

        } catch (err) {
            console.error("OCR Error:", err);
            setError("Error al procesar. Intenta nuevamente.");
        } finally {
            setScanning(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        startCamera();
    };

    return (
        <div className="flex flex-col items-center justify-center p-0 bg-black rounded-2xl overflow-hidden relative mb-4 h-[400px] w-full border border-white/20">

            {/* Live Camera View */}
            {isCameraActive && !scanning && (
                <>
                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />

                    {/* Overlay Guide */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-[80%] h-[150px] border-2 border-[color:var(--accent-purple)] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative">
                            <p className="absolute -top-8 left-0 right-0 text-center text-white font-medium text-sm drop-shadow-md bg-black/50 py-1 rounded">
                                Centra el TOTAL aquí
                            </p>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                        <button
                            onClick={captureAndProcess}
                            className="bg-white rounded-full p-4 shadow-lg hover:scale-105 transition-transform active:scale-95"
                        >
                            <div className="w-6 h-6 rounded-full border-2 border-black"></div>
                        </button>
                    </div>
                </>
            )}

            {/* Hidden Canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning State */}
            {scanning && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                    <Loader2 className="w-10 h-10 text-[color:var(--accent-purple)] animate-spin mb-4" />
                    <p className="text-white font-medium mb-2">Analizando Neuronas...</p>
                    <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[color:var(--accent-purple)] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !scanning && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Intentar de nuevo
                    </button>
                </div>
            )}

            {/* Fallback / Initial State if camera fails or permissions denied */}
            {!isCameraActive && !scanning && !error && (
                <div className="text-center p-6">
                    <p className="text-gray-400 mb-4">La cámara no está activa</p>
                    <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-[color:var(--accent-purple)] text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Activar Cámara
                    </button>
                </div>
            )}

        </div>
    );
};

export default ReceiptScanner;
