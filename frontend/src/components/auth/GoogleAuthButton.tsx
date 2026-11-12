import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { signInWithGoogle } from "../../services/authService";

interface GoogleAuthButtonProps {
  action: "login" | "signup";
}

export default function GoogleAuthButton({
  action,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google authentication failed.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-forest py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest/10 transition hover:-translate-y-0.5 hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-forest">
          G
        </span>
        {loading
          ? "Redirecting..."
          : action === "login"
            ? "Continue with Google"
            : "Sign up with Google"}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
