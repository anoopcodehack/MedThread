import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmail, getRoleLandingPath } from "../../services/authService";
import GoogleAuthButton from "./GoogleAuthButton";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await signInWithEmail(email.trim(), password);
      navigate(getRoleLandingPath(user.user_metadata?.role), {
        replace: true,
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to log in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-12 w-full rounded-xl border border-[#DCE5DA] bg-white px-4 text-sm outline-none focus:border-[#719777] focus:ring-2 focus:ring-[#719777]/20"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-forest py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest/10 transition hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Login with email"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-[#EDF0EA]" />
        or
        <span className="h-px flex-1 bg-[#EDF0EA]" />
      </div>

      <GoogleAuthButton action="login" />
    </div>
  );
}