import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2, X, Check, RefreshCw, Zap } from 'lucide-react';
import { receiptBrain } from '../lib/ReceiptBrain';

const ReceiptScanner = ({ onScanComplete, onClose }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState(null);
    const [autoScanEnabled, setAutoScanEnabled] = useState(true);
    const [lastScannedText, setLastScannedText] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);

    // Initialize Camera
    const startCamera = async () => {
        try {
            setError(null);

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            let constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 }, // Lower res for faster auto-scanning performance
                    height: { ideal: 720 }
                }
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            setIsCameraActive(true);

        } catch (err) {
            console.error("Camera Error:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Permiso de cámara denegado. Habilítalo en tu navegador.");
            } else {
                setError("No se pudo acceder a la cámara. Intenta reiniciar la app.");
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraActive(false);
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    useEffect(() => {
        if (isCameraActive && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Video play error:", e));
        }
    }, [isCameraActive, stream]);

    // Auto-Scan Loop
    useEffect(() => {
        if (isCameraActive && autoScanEnabled && !scanning && !error) {
            intervalRef.current = setInterval(() => {
                if (!scanning) {
                    captureAndProcess(true); // Is Auto Mode
                }
            }, 1000); // Check every 1 second
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isCameraActive, autoScanEnabled, scanning, error]);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const captureAndProcess = (isAuto = false) => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.videoWidth === 0) return;

        // Capture frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Optimization: Reduce size for speed
        const MAX_WIDTH = 800; // Good balance for Tesseract
        let width = canvas.width;
        let height = canvas.height;

        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;

            // Redraw resized
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0, width, height);

            // Grayscale for tempCtx
            const imageData = tempCtx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
            tempCtx.putImageData(imageData, 0, 0);

            const imageUrl = tempCanvas.toDataURL('image/jpeg', 0.7); // Low quality is fine for text
            processImage(imageUrl, isAuto);
        } else {
            const imageUrl = canvas.toDataURL('image/jpeg', 0.7);
            processImage(imageUrl, isAuto);
        }
    };

    const processImage = async (imageUrl, isAuto) => {
        if (isAuto && scanning) return; // Prevent overlapping scans

        setScanning(true);
        if (!isAuto) setProgress(0);

        try {
            const result = await Tesseract.recognize(
                imageUrl,
                'spa',
                {
                    logger: m => {
                        if (!isAuto && m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            const amount = receiptBrain.analyze(text);

            if (amount) {
                // Success!
                // Feedback
                if (navigator.vibrate) navigator.vibrate(200);

                // Pass back both amount AND the raw text for future training
                // We assume onScanComplete can handle an object or just the amount.
                // For now, let's just pass the amount, but store text in state if we want to expose training differently.
                // Ideally onScanComplete(amount, fullText)

                onScanComplete(amount, text);
                stopCamera();
            } else {
                if (!isAuto) {
                    setError("No encontré un total claro. Intenta acercar y centrar.");
                    setIsCameraActive(false);
                }
                // If auto, just fail silently and try again next loop
            }

        } catch (err) {
            console.error("OCR Error:", err);
            if (!isAuto) setError("Error al procesar.");
        } finally {
            setScanning(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        startCamera();
    };

    return (
        <div className="flex flex-col items-center justify-center p-0 bg-black rounded-2xl overflow-hidden relative mb-4 h-[400px] w-full border border-white/20 shadow-2xl">

            {/* Live Camera View */}
            {isCameraActive && (
                <>
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

                    {/* Overlay Guide */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-[85%] h-[120px] border-2 border-[color:var(--accent-purple)] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative animate-pulse-slow">
                            <div className="absolute -top-10 left-0 right-0 flex justify-center">
                                <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-md border border-white/10">
                                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    Auto-Escaneo Activo
                                </span>
                            </div>

                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white -mb-1 -mr-1"></div>
                        </div>
                        <p className="mt-8 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                            Apuntando al Total...
                        </p>
                    </div>
                </>
            )}

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Indicator (Only for Auto if strictly needed, or Manual) */}
            {scanning && !autoScanEnabled && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                    <Loader2 className="w-10 h-10 text-[color:var(--accent-purple)] animate-spin mb-4" />
                    <p className="text-white font-medium">Procesando...</p>
                </div>
            )}

            {/* Subtle processing indicator for Auto-Mode */}
            {scanning && autoScanEnabled && (
                <div className="absolute top-4 right-4 z-30">
                    <Loader2 className="w-5 h-5 text-white/80 animate-spin" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20">
                    <X className="w-12 h-12 text-red-500 mb-4 opacity-80" />
                    <p className="text-white font-bold mb-1">¡Ups!</p>
                    <p className="text-gray-300 text-sm mb-6">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-6 py-3 bg-[color:var(--accent-purple)] hover:opacity-90 rounded-xl text-white font-medium transition-all transform active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4" /> Intentar de nuevo
                    </button>
                </div>
            )}

            {/* Permission / Start State */}
            {!isCameraActive && !error && (
                <div className="text-center p-6 z-10">
                    <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4 max-w-[200px] mx-auto text-sm">Necesitamos acceso a tu cámara para escanear facturas.</p>
                    <button
                        onClick={startCamera}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                    >
                        Activar Cámara
                    </button>
                </div>
            )}

        </div>
    );
};

export default ReceiptScanner;
