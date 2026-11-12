import { ClipboardList, Eye, ShieldCheck, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PatientTable from "../../components/doctor/PatientTable";
import StatCard from "../../components/doctor/StatCard";
import { getDashboardData, getDoctorProfile } from "../../services/doctorService";
import type { DoctorProfile } from "../../types/doctor";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export default function DoctorDashboard() {
  const [data, setData] = useState<DashboardData>();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    void getDashboardData().then(setData);
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

  if (!data) return <LoadingSpinner />;

  const doctorName = profile?.name || "Dr. Ananya Rao";

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-forest p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="mb-2 text-sm text-sage">Good morning</p>
          <h1 className="font-heading text-3xl font-extrabold">Welcome back, {doctorName}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
            Access authorised patient records and review each piece of evidence in one organised medical history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/doctor/profile?edit=true"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <UserRound size={17} />
            Edit Profile
          </Link>
          <Link
            to="/doctor/scan"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-forest transition hover:bg-sage"
          >
            <ShieldCheck size={18} />
            Scan Patient QR
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Patients Accessed" value={data.totalPatients} icon={Users} />
        <StatCard label="Recently Viewed Records" value={data.recentlyViewed} icon={Eye} />
        <StatCard label="Active Patient Access" value={data.activeAccess} icon={ClipboardList} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold">Recent patient access</h2>
            <p className="mt-1 text-sm text-muted">Records you have recently viewed.</p>
          </div>
          <Link to="/doctor/recent-patients" className="text-sm font-bold text-forest hover:underline">
            View all
          </Link>
        </div>
        <PatientTable patients={data.recentPatients} />
      </section>
    </div>
  );
}
