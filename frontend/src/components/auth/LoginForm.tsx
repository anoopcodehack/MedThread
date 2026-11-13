import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, UserRound, Check, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { signInWithEmail, getRoleLandingPath } from "../../services/authService";
import GoogleAuthButton from "./GoogleAuthButton";
import type { UserRole } from "../../types/auth";

const DEMO_DOCTOR_EMAIL = import.meta.env.VITE_DEMO_DOCTOR_EMAIL || "doctor@medthread.io";
const DEMO_DOCTOR_PWD = import.meta.env.VITE_DEMO_DOCTOR_PASSWORD || "DoctorDemo2026!";

export const PATIENT_ACCOUNTS = [
  { id: 101, name: "Rajesh Sharma", code: "PAT-101", email: "sharma@medthread.io", desc: "Elderly Parent (12 yrs)" },
  { id: 102, name: "Priya Patel", code: "PAT-102", email: "patel@medthread.io", desc: "Asthma & Allergy Profile" },
  { id: 103, name: "Vikram Malhotra", code: "PAT-103", email: "malhotra@medthread.io", desc: "Cardiology & Statin" },
  { id: 104, name: "Mohammed Irfan", code: "PAT-104", email: "irfan@medthread.io", desc: "Renal & Glycemic" },
  { id: 105, name: "David Fernandes", code: "PAT-105", email: "david@medthread.io", desc: "Clean Baseline Checkup" },
];

export default function LoginForm() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"doctor" | "patient">("doctor");
  const [email, setEmail] = useState(DEMO_DOCTOR_EMAIL);
  const [password, setPassword] = useState(DEMO_DOCTOR_PWD);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRoleSelect = (role: "doctor" | "patient") => {
    setSelectedRole(role);
    if (role === "doctor") {
      setEmail(DEMO_DOCTOR_EMAIL);
      setPassword(DEMO_DOCTOR_PWD);
    } else {
      setEmail("sharma@medthread.io");
      setPassword("PatientDemo2026!");
    }
    setError("");
  };

  const handleDirectDemoLogin = (role: "doctor" | "patient", patientId?: number) => {
    sessionStorage.setItem("medthread.currentRole", role);
    if (role === "doctor") {
      navigate("/doctor", { replace: true });
    } else {
      sessionStorage.setItem("medthread.authenticatedPatientId", String(patientId || 101));
      navigate("/patient", { replace: true });
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Instant match for demo doctor
    if (
      (cleanEmail === DEMO_DOCTOR_EMAIL.toLowerCase() || cleanEmail.includes("doctor")) &&
      selectedRole === "doctor"
    ) {
      sessionStorage.setItem("medthread.currentRole", "doctor");
      navigate("/doctor", { replace: true });
      return;
    }

    // 2. Individual Patient Matching
    if (selectedRole === "patient") {
      let matchedPatientId = 101;
      if (cleanEmail.includes("102") || cleanEmail.includes("patel") || cleanEmail.includes("priya")) {
        matchedPatientId = 102;
      } else if (cleanEmail.includes("103") || cleanEmail.includes("malhotra") || cleanEmail.includes("vikram")) {
        matchedPatientId = 103;
      } else if (cleanEmail.includes("104") || cleanEmail.includes("irfan") || cleanEmail.includes("mohammed")) {
        matchedPatientId = 104;
      } else if (cleanEmail.includes("105") || cleanEmail.includes("fernandes") || cleanEmail.includes("david")) {
        matchedPatientId = 105;
      } else {
        matchedPatientId = 101;
      }

      sessionStorage.setItem("medthread.currentRole", "patient");
      sessionStorage.setItem("medthread.authenticatedPatientId", String(matchedPatientId));
      navigate("/patient", { replace: true });
      return;
    }

    // 3. Cloud Supabase authentication with graceful local demo fallback
    try {
      const user = await signInWithEmail(cleanEmail, password);
      const targetRole = (user.user_metadata?.role as UserRole) || selectedRole;
      navigate(getRoleLandingPath(targetRole), { replace: true });
    } catch (reason) {
      if (password.length >= 4) {
        console.warn("Supabase auth offline, proceeding with local role session:", reason);
        sessionStorage.setItem("medthread.currentRole", selectedRole);
        navigate(getRoleLandingPath(selectedRole), { replace: true });
        return;
      }
      setError(reason instanceof Error ? reason.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Role Selection Tabs */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#344C3A]">
          Login as
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRoleSelect("doctor")}
            className={`relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
              selectedRole === "doctor"
                ? "border-forest bg-[#EDF4E9] ring-2 ring-forest/30 shadow-xs"
                : "border-[#E0E8DE] bg-white hover:border-[#A9C2A8]"
            }`}
          >
            <div className={`p-2 rounded-xl ${selectedRole === "doctor" ? "bg-forest text-white" : "bg-cream text-[#829084]"}`}>
              <Stethoscope size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-sm font-bold text-[#193A29]">
                Doctor
              </strong>
              <span className="block text-[11px] text-[#718077] truncate">
                Clinical Cockpit
              </span>
            </div>
            {selectedRole === "doctor" && (
              <span className="h-5 w-5 rounded-full bg-forest text-white flex items-center justify-center shrink-0">
                <Check size={12} />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect("patient")}
            className={`relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
              selectedRole === "patient"
                ? "border-[#164A32] bg-[#EDF4E9] ring-2 ring-[#164A32]/30 shadow-xs"
                : "border-[#E0E8DE] bg-white hover:border-[#A9C2A8]"
            }`}
          >
            <div className={`p-2 rounded-xl ${selectedRole === "patient" ? "bg-[#164A32] text-white" : "bg-cream text-[#829084]"}`}>
              <UserRound size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-sm font-bold text-[#193A29]">
                Patient
              </strong>
              <span className="block text-[11px] text-[#718077] truncate">
                Personal Records
              </span>
            </div>
            {selectedRole === "patient" && (
              <span className="h-5 w-5 rounded-full bg-[#164A32] text-white flex items-center justify-center shrink-0">
                <Check size={12} />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Demo Credentials Pill */}
      <div className="rounded-xl border border-sage/60 bg-cream/70 p-3 text-xs text-[#26352D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-forest shrink-0" />
          <span className="truncate">
            Demo {selectedRole === "doctor" ? "Doctor" : "Patient"}: <strong className="font-mono">{email}</strong>
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold text-forest bg-sage/40 px-2 py-0.5 rounded">
          Auto-Filled
        </span>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[#344C3A]">Email address</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-11 w-full rounded-xl border border-[#DCE5DA] bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[#344C3A]">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11 w-full rounded-xl border border-[#DCE5DA] bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* If Patient selected, show 5 individual patient accounts */}
        {selectedRole === "patient" && (
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#344C3A]">
              Quick Access: 5 Individual Patient Accounts
            </label>
            <div className="space-y-1.5">
              {PATIENT_ACCOUNTS.map((pat) => (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => handleDirectDemoLogin("patient", pat.id)}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DA] bg-[#F7FAF6] hover:bg-[#E8F2E6] hover:border-forest/40 text-left transition flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-xs text-slate-900 group-hover:text-forest flex items-center gap-1.5">
                      <span>{pat.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-slate-500 border border-slate-200">
                        {pat.code}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {pat.desc} • <span className="font-mono text-[10px] text-emerald-800">{pat.email}</span>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-forest shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-forest py-3.5 text-sm font-bold text-white shadow-lg shadow-forest/15 transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting 
            ? "Signing in…" 
            : `Login to ${selectedRole === "doctor" ? "Doctor Cockpit" : "Patient Portal"}`}
        </button>
      </form>

      {/* Instant Demo Access Divider & 1-Click Buttons */}
      <div className="pt-1">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#EDF0EA]"></div>
          <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-muted">
            1-Click Direct Demo
          </span>
          <div className="flex-grow border-t border-[#EDF0EA]"></div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-1">
          <button
            type="button"
            onClick={() => handleDirectDemoLogin("doctor")}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-forest/25 bg-forest/5 px-3 py-2.5 text-xs font-bold text-forest transition hover:bg-forest hover:text-white"
          >
            <Stethoscope size={16} />
            <span>Doctor Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleDirectDemoLogin("patient")}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#164A32]/25 bg-[#164A32]/5 px-3 py-2.5 text-xs font-bold text-[#164A32] transition hover:bg-[#164A32] hover:text-white"
          >
            <UserRound size={16} />
            <span>Patient Portal</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted pt-1">
        <span className="h-px flex-1 bg-[#EDF0EA]" />
        or continue with
        <span className="h-px flex-1 bg-[#EDF0EA]" />
      </div>

      <GoogleAuthButton action="login" />
    </div>
  );
}
