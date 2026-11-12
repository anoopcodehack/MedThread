import { Bell, Menu, UserRound, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctorProfile } from "../../services/doctorService";
import { BenchmarkModal } from "../modals/BenchmarkModal";
import type { DoctorProfile } from "../../types/doctor";

export default function DoctorHeader() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  useEffect(() => {
    void getDoctorProfile().then(setProfile);

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<DoctorProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        void getDoctorProfile().then(setProfile);
      }
    };

    window.addEventListener("medthread_doctor_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("medthread_doctor_profile_updated", handleProfileUpdate);
    };
  }, []);

  const doctorName = profile?.name || "Dr. Ananya Rao";

  return (
    <header className="flex items-center justify-between border-b border-sage bg-white px-5 py-4 sm:px-8">
      <button type="button" className="text-muted lg:hidden" aria-label="Open navigation">
        <Menu size={22} />
      </button>
      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Doctor workspace</p>
        <p className="font-heading text-lg font-bold text-forest">Evidence-first care</p>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsBenchmarkOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-xs transition"
          title="SOSC SYNERGY 26 (PS-7) Quantitative Benchmark Scorecard"
        >
          <Award className="h-4 w-4 text-emerald-600" />
          <span>Benchmark Scorecard (-78% Time)</span>
        </button>
        <button type="button" className="text-muted" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <Link
          to="/doctor/profile"
          className="flex items-center gap-2 text-sm font-semibold text-forest transition hover:opacity-85"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage">
            <UserRound size={18} />
          </span>
          <span className="hidden sm:inline">{doctorName}</span>
        </Link>
      </div>

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />
    </header>
  );
}
