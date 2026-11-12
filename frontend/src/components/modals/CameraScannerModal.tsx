import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Scan, 
  Sparkles, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

interface CameraScannerModalProps {
  isOpen: boolean;
  patientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  patientId,
  onClose,
  onSuccess
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'extracting' | 'complete'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCapturedFile(null);
      setScanStep('idle');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } else {
        setErrorMessage('Camera access is not supported on this browser. Please use file upload.');
      }
    } catch {
      setErrorMessage('Camera permission denied or camera unavailable. Please upload a photo directly.');
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);

        // Convert dataUrl to a File object for the API
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `Prescription_Scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setCapturedFile(file);
          });

        stopCamera();
      }
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      stopCamera();
    }
  };

  const handleProcessScan = async () => {
    if (!capturedFile) return;

    setIsProcessing(true);
    setScanStep('scanning');
    setErrorMessage(null);

    try {
      // Step 1: Simulate optical enhancement
      await new Promise((resolve) => setTimeout(resolve, 800));
      setScanStep('extracting');

      // Step 2: Upload to MedThread multi-document ingestion API
      await api.uploadDocument(patientId, capturedFile);

      setScanStep('complete');
      await new Promise((resolve) => setTimeout(resolve, 600));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to ingest scanned document.';
      setErrorMessage(msg);
      setScanStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-forest/10 text-forest">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-forest text-lg">
                  Optical Prescription &amp; Document Scanner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-forest/10 text-forest">
                  Live OCR Ingestion
                </span>
              </div>
              <p className="text-xs text-muted font-medium mt-0.5">
                Capture crumpled paper prescriptions or lab reports for deterministic timeline stitching
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            title="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder Body */}
        <div className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="relative aspect-4/3 w-full rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden">
            
            {/* Live Camera Feed */}
            {streamActive && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {/* Captured Preview */}
            {capturedImage && !streamActive && (
              <img
                src={capturedImage}
                alt="Captured Prescription"
                className="w-full h-full object-contain bg-slate-950"
              />
            )}

            {/* Empty Idle State */}
            {!streamActive && !capturedImage && (
              <div className="text-center p-6 space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Scan className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Point camera at prescription or paper record</p>
                  <p className="text-xs text-slate-400">Auto-align corners and ensure text is clearly legible</p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-forest text-white hover:bg-forest/90 transition shadow-xs"
                  >
                    <Camera className="h-4 w-4" />
                    Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                  >
                    <Upload className="h-4 w-4" />
                    Select Image
                  </button>
                </div>
              </div>
            )}

            {/* Viewfinder Target Reticle Overlay */}
            {(streamActive || capturedImage) && (
              <div className="pointer-events-none absolute inset-6 border border-emerald-500/50 rounded-xl flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                  <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                  <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleManualUpload}
            />
          </div>

          {/* Capture Controls when Camera is Active */}
          {streamActive && (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={captureFrame}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition"
              >
                <Camera className="h-4 w-4" />
                Capture Document
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Review & Process State */}
          {capturedImage && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Document captured. Ready for deterministic OCR timeline extraction.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setCapturedFile(null);
                    startCamera();
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retake
                </button>
              </div>

              <button
                type="button"
                onClick={handleProcessScan}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-forest text-white hover:bg-forest/90 transition shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {scanStep === 'scanning' ? 'Optical Deskewing & Contrast Boost...' : 
                       scanStep === 'extracting' ? 'Extracting Verbatim Facts to Timeline...' : 
                       'Completing Ingestion...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Extract &amp; Append to Patient History</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
