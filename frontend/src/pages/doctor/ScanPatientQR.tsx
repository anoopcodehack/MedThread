import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRScanner from "../../components/doctor/QRScanner";
import { scanPatientQRCode } from "../../services/doctorService";

export default function ScanPatientQR() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async (token: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await scanPatientQRCode(token);
      navigate(`/doctor/patients/${result.patientId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "The patient code could not be verified.");
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="text-sm font-semibold text-muted">Patient access</p><h1 className="mt-1 font-heading text-3xl font-extrabold">Scan Patient QR Code</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Ask the patient to display their MedThread QR code. Access is only granted after the backend verifies the token, consent and expiry.</p></div>
      <div className="rounded-3xl border border-sage bg-white p-5 shadow-sm sm:p-8"><QRScanner onToken={(token) => void verify(token)} loading={loading} /><div className="my-7 flex items-center gap-3 text-xs uppercase tracking-widest text-muted"><span className="h-px flex-1 bg-sage" />Or enter code manually<span className="h-px flex-1 bg-sage" /></div><form onSubmit={(event) => { event.preventDefault(); void verify(code); }} className="flex flex-col gap-3 sm:flex-row"><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter patient access code" className="min-w-0 flex-1 rounded-xl border border-sage bg-cream px-4 py-3 text-sm outline-none focus:border-forest" /><button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Verifying..." : "Verify access"}<ArrowRight size={17} /></button></form>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<p className="mt-6 flex items-center gap-2 text-xs text-muted"><LockKeyhole size={15} />The QR code contains an access token, not medical information.</p></div>
    </div>
  );
}
