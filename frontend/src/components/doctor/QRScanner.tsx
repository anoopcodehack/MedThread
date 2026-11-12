import { Html5Qrcode } from "html5-qrcode";
import { ImageUp, ScanLine, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onToken: (token: string) => void;
  loading: boolean;
}

export default function QRScanner({ onToken, loading }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const stop = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setRunning(false);
  };

  const start = async () => {
    setError("");
    try {
      const scanner = new Html5Qrcode("patient-qr-reader");
      scannerRef.current = scanner;
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, (decoded) => {
        onToken(decoded);
        void stop();
      }, () => undefined);
      setRunning(true);
    } catch {
      setError("Camera permission was denied or no camera is available. You can upload a QR image or enter a code instead.");
    }
  };

  const scanFile = async (file: File) => {
    setError("");
    try {
      const scanner = new Html5Qrcode("patient-qr-reader");
      const decoded = await scanner.scanFile(file, true);
      onToken(decoded);
    } catch {
      setError("This image does not contain a readable QR code.");
    }
  };

  useEffect(() => () => { if (scannerRef.current?.isScanning) void scannerRef.current.stop(); }, []);

  return (
    <div className="space-y-4">
      <div id="patient-qr-reader" className="min-h-[280px] overflow-hidden rounded-2xl border-2 border-dashed border-sage bg-cream [&>div]:border-0" />
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void (running ? stop() : start())} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{running ? <Square size={17} /> : <ScanLine size={17} />}{running ? "Stop camera" : "Start camera"}</button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-sage bg-white px-4 py-3 text-sm font-bold text-forest disabled:opacity-50"><ImageUp size={17} />Upload QR image</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void scanFile(file); }} />
      </div>
    </div>
  );
}
