import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import RoleSelector from "./RoleSelector";
import GoogleAuthButton from "./GoogleAuthButton";
import {
  getRoleLandingPath,
  signUpWithEmail,
} from "../../services/authService";
import type { UserRole } from "../../types/auth";

export default function SignupForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const result = await signUpWithEmail({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (result.confirmationRequired) {
        setMessage(
          "Account created. Check your email to confirm the address, then log in.",
        );
        return;
      }

      navigate(
        getRoleLandingPath(result.user?.user_metadata?.role ?? role),
        { replace: true },
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to create account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#344C3A]">Full name</span>
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="h-12 w-full rounded-xl border border-[#DCE5DA] bg-white px-4 text-sm outline-none focus:border-[#719777] focus:ring-2 focus:ring-[#719777]/20"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#344C3A]">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-12 w-full rounded-xl border border-[#DCE5DA] bg-white px-4 text-sm outline-none focus:border-[#719777] focus:ring-2 focus:ring-[#719777]/20"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#344C3A]">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-12 w-full rounded-xl border border-[#DCE5DA] bg-white px-4 text-sm outline-none focus:border-[#719777] focus:ring-2 focus:ring-[#719777]/20"
          />
        </label>

        <RoleSelector value={role} onChange={setRole} />

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-lg bg-[#EAF1EB] p-3 text-sm text-[#164A32]">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-forest py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest/10 transition hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-[#EDF0EA]" />
        or
        <span className="h-px flex-1 bg-[#EDF0EA]" />
      </div>

      <GoogleAuthButton action="signup" role={role} />
    </div>
  );
}