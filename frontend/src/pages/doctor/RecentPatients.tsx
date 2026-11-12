import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PatientTable from "../../components/doctor/PatientTable";
import { getRecentPatients } from "../../services/doctorService";
import type { RecentPatient } from "../../types/doctor";

export default function RecentPatients() {
  const [patients, setPatients] = useState<RecentPatient[]>();
  const [query, setQuery] = useState("");
  useEffect(() => { void getRecentPatients().then(setPatients); }, []);
  if (!patients) return <LoadingSpinner />;
  const filtered = patients.filter((patient) => `${patient.name} ${patient.id}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-6"><div><h1 className="font-heading text-3xl font-extrabold">Recent Patients</h1><p className="mt-2 text-sm text-muted">Previously accessed patient records.</p></div><div className="relative max-w-md"><Search size={18} className="absolute left-3 top-3.5 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or patient ID" className="w-full rounded-xl border border-sage bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-forest" /></div><PatientTable patients={filtered} /></div>;
}
