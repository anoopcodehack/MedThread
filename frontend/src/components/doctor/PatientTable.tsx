import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { RecentPatient } from "../../types/doctor";

interface PatientTableProps {
  patients: RecentPatient[];
}

export default function PatientTable({ patients }: PatientTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-5 py-4">Patient</th><th className="px-5 py-4">Patient ID</th><th className="px-5 py-4">Last accessed</th><th className="px-5 py-4">Status</th><th className="px-5 py-4" /></tr>
          </thead>
          <tbody className="divide-y divide-sage">
            {patients.map((patient) => (
              <tr key={patient.id} className="text-forest">
                <td className="px-5 py-4 font-semibold">{patient.name}</td>
                <td className="px-5 py-4 text-muted">{patient.id}</td>
                <td className="px-5 py-4 text-muted">{patient.lastAccessed}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-sage px-2.5 py-1 text-xs font-semibold text-forest">{patient.status}</span></td>
                <td className="px-5 py-4 text-right"><Link className="inline-flex items-center gap-1 font-semibold text-forest hover:underline" to={`/doctor/patients/${patient.id}`}>View <ArrowUpRight size={15} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
