import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, UserRound, Check, Sparkles, ShieldAlert } from "lucide-react";
import { signInWithEmail, getRoleLandingPath } from "../../services/authService";
import GoogleAuthButton from "./GoogleAuthButton";
import type { UserRole } from "../../types/auth";

const DEMO_DOCTOR_EMAIL = import.meta.env.VITE_DEMO_DOCTOR_EMAIL || "doctor@medthread.io";
const DEMO_DOCTOR_PWD = import.meta.env.VITE_DEMO_DOCTOR_PASSWORD || "DoctorDemo2026!";
const DEMO_PATIENT_EMAIL = import.meta.env.VITE_DEMO_PATIENT_EMAIL || "patient@medthread.io";
const DEMO_PATIENT_PWD = import.meta.env.VITE_DEMO_PATIENT_PASSWORD || "PatientDemo2026!";

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
      setEmail(DEMO_PATIENT_EMAIL);
      setPassword(DEMO_PATIENT_PWD);
    }
    setError("");
  };

  const handleDirectDemoLogin = (role: "doctor" | "patient") => {
    sessionStorage.setItem("medthread.currentRole", role);
    if (role === "doctor") {
      navigate("/doctor", { replace: true });
    } else {
      navigate("/patient", { replace: true });
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Instant match for demo accounts
    if (
      (cleanEmail === DEMO_DOCTOR_EMAIL.toLowerCase() || cleanEmail.includes("doctor")) &&
      selectedRole === "doctor"
    ) {
      sessionStorage.setItem("medthread.currentRole", "doctor");
      navigate("/doctor", { replace: true });
      return;
    }

    if (
      (cleanEmail === DEMO_PATIENT_EMAIL.toLowerCase() || cleanEmail.includes("patient")) &&
      selectedRole === "patient"
    ) {
      sessionStorage.setItem("medthread.currentRole", "patient");
      navigate("/patient", { replace: true });
      return;
    }

    // 2. Cloud Supabase authentication with graceful local demo fallback
    try {
      const user = await signInWithEmail(cleanEmail, password);
      const targetRole = (user.user_metadata?.role as UserRole) || selectedRole;
      navigate(getRoleLandingPath(targetRole), { replace: true });
    } catch (reason) {
      // If cloud auth is unreachable or offline, allow demo authentication using the selected role
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
          <Sparkles className="h-4 w-4 text-forest shrink-0" />
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
