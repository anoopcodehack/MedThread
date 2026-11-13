import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="w-full max-w-lg rounded-3xl border border-[#E5EBE2] bg-white/95 p-6 shadow-2xl shadow-forest/10 sm:p-9">
      <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#EDF2EB] p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg py-3 text-sm font-semibold transition ${
            mode === "login"
              ? "bg-forest text-white shadow"
              : "text-[#425B48] hover:text-forest"
          }`}
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg py-3 text-sm font-semibold transition ${
            mode === "signup"
              ? "bg-forest text-white shadow"
              : "text-[#425B48] hover:text-forest"
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="mb-6">
        <h2 className="font-heading text-2xl font-extrabold text-[#193A29]">
          {mode === "login" ? "Welcome Back!" : "Create Account"}
        </h2>

        <p className="mt-2 text-xs text-muted">
          {mode === "login"
            ? "Login to continue to MedThread."
            : "Create your account to get started."}
        </p>
      </div>

      {mode === "login" ? <LoginForm /> : <SignupForm />}

      <div className="mt-7 border-t border-[#EDF0EA] pt-5 text-center">
        <p className="text-xs text-muted">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() =>
              setMode(mode === "login" ? "signup" : "login")
            }
            className="ml-1 font-bold text-forest hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-muted">
          <ShieldCheck size={15} />
          Secure access to your medical history
        </div>
      </div>
    </div>
  );
}