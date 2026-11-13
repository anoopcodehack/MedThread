import {
  Activity,
  CalendarDays,
  ShieldCheck,
  Pill,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthForm from "./AuthForm";
import { BrandLogo } from "../common/BrandLogo";
import { getSupabaseClient } from "../../lib/supabase";
import {
  getRoleLandingPath,
  PENDING_SIGNUP_ROLE_KEY,
} from "../../services/authService";

export default function AuthLayout() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;

    async function redirectExistingSession() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) return;

        const user = data.session.user;
        const pendingRole = sessionStorage.getItem(PENDING_SIGNUP_ROLE_KEY);
        let role = user.user_metadata?.role as string | undefined;

        if (!role && pendingRole) {
          const { data: updated, error: updateError } =
            await supabase.auth.updateUser({ data: { role: pendingRole } });
          if (updateError) throw updateError;
          role = updated.user.user_metadata?.role;
        }

        sessionStorage.removeItem(PENDING_SIGNUP_ROLE_KEY);
        if (active) {
          navigate(getRoleLandingPath(role), { replace: true });
        }
      } catch (reason) {
        if (active) {
          setAuthError(
            reason instanceof Error
              ? reason.message
              : "Unable to restore your authentication session.",
          );
        }
      }
    }

    void redirectExistingSession();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen grid-cols-1 bg-cream lg:grid-cols-2">

      {/* Left background section */}
      <section
        className="relative hidden min-h-screen bg-cover bg-center lg:flex"
        style={{ backgroundImage: "url('/medical-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#103923]/85 via-[#16472E]/65 to-[#16472E]/30" />

        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-16">

          <BrandLogo theme="light" size="lg" showSubtitle />

          <div className="max-w-xl">
            <span className="text-xs font-bold tracking-[3px] text-[#D9EAD5]">
              YOUR HEALTH, CONNECTED
            </span>

            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-6xl">
              Your Medical History,
              <br />
              <span className="text-[#C9E6BD]">
                Finally in One Place.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-8 text-white/80">
              Bring together your prescriptions, lab reports and discharge
              summaries into one organised, verifiable medical history.
            </p>

            <div className="mt-10 space-y-6">
              {[
                {
                  icon: CalendarDays,
                  title: "Chronological Timeline",
                  text: "View your health journey over time",
                },
                {
                  icon: Pill,
                  title: "Medication Tracking",
                  text: "Track starts, changes and stops",
                },
                {
                  icon: ShieldCheck,
                  title: "Verified Information",
                  text: "Every detail linked to its source",
                },
                {
                  icon: Activity,
                  title: "Role-based Access",
                  text: "For patients, caretakers and doctors",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="flex items-center gap-4">
                    <div className="rounded-xl border border-white/20 bg-white/15 p-3 text-[#E3F2DC]">
                      <Icon size={22} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/70">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] tracking-[2px] text-white/60">
            MEDTHREAD · YOUR HEALTH STORY
          </p>
        </div>
      </section>

      {/* Right authentication section */}
      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex justify-center lg:hidden">
            <BrandLogo theme="dark" size="lg" showSubtitle />
          </div>

          {authError && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {authError}
            </p>
          )}

          <AuthForm />
        </div>
      </section>

    </main>
  );
}