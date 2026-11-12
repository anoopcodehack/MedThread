import { ArrowLeft, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getPatientRecords } from "../../services/doctorService";
import type { PatientRecords as PatientRecordsType } from "../../types/doctor";

const valueOrNotDocumented = (value?: string | number) => value || "Not documented";

export default function PatientRecords() {
  const { patientId = "" } = useParams();
  const [records, setRecords] = useState<PatientRecordsType>();
  useEffect(() => { void getPatientRecords(patientId).then(setRecords); }, [patientId]);
  if (!records) return <LoadingSpinner />;
  const { profile } = records;
  return (
    <div className="space-y-7">
      <Link to="/doctor/recent-patients" className="inline-flex items-center gap-2 text-sm font-bold text-forest hover:underline"><ArrowLeft size={17} />Back to patients</Link>
      <div><p className="text-sm font-semibold text-muted">Read-only patient record</p><h1 className="mt-1 font-heading text-3xl font-extrabold">{profile.name}</h1><p className="mt-2 text-sm text-muted">{profile.id}</p></div>
      <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm"><h2 className="mb-5 font-heading text-xl font-bold">Patient profile</h2><div className="grid gap-5 sm:grid-cols-4">{[["Patient ID", profile.id], ["Age", profile.age], ["Gender", profile.gender], ["Blood group", profile.bloodGroup]].map(([label, value]) => <div key={label as string}><p className="text-xs text-muted">{label}</p><p className="mt-1 font-semibold text-forest">{valueOrNotDocumented(value as string | number)}</p></div>)}</div></section>
      <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm"><h2 className="mb-5 font-heading text-xl font-bold">Medical history timeline</h2><div className="space-y-6">{records.timeline.map((item) => <div key={item.id} className="relative border-l-2 border-sage pl-5"><span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-forest" /><p className="text-xs font-semibold text-muted">{item.date}</p><h3 className="mt-1 font-bold text-forest">{item.event}</h3><p className="mt-1 text-sm text-muted">{valueOrNotDocumented(item.description)}</p><p className="mt-2 text-xs text-forest">Source: {valueOrNotDocumented(item.source)}</p></div>)}</div></section>
      <div className="grid gap-6 xl:grid-cols-2"><RecordSection title="Medications"><div className="space-y-3">{records.medications.map((item) => <div key={item.id} className="rounded-xl bg-cream p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{item.name}</p><span className="rounded-full bg-sage px-2 py-1 text-xs font-semibold">{item.status}</span></div><p className="mt-2 text-sm text-muted">{valueOrNotDocumented(item.dosage)}</p><p className="mt-1 text-xs text-muted">Start: {valueOrNotDocumented(item.startDate)} · End: {valueOrNotDocumented(item.endDate)}</p></div>)}</div></RecordSection><RecordSection title="Allergies"><div className="space-y-3">{records.allergies.map((item) => <div key={item.id} className="rounded-xl bg-cream p-4"><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-muted">Severity: {valueOrNotDocumented(item.severity)}</p><p className="mt-2 text-xs text-forest">Source: {valueOrNotDocumented(item.source)}</p></div>)}</div></RecordSection></div>
      <RecordSection title="Investigations and lab reports"><DataTable headers={["Investigation", "Date", "Result", "Source"]} rows={records.investigations.map((item) => [item.name, item.date, `${valueOrNotDocumented(item.result)} ${item.unit || ""}`.trim(), valueOrNotDocumented(item.source)])} /></RecordSection>
      <div className="grid gap-6 xl:grid-cols-2"><RecordSection title="Prescriptions"><div className="space-y-3">{records.prescriptions.map((item) => <div key={item.id} className="rounded-xl bg-cream p-4"><p className="text-xs text-muted">{item.date}</p><p className="mt-1 font-semibold">{valueOrNotDocumented(item.doctor)}</p><p className="mt-2 text-sm text-muted">{valueOrNotDocumented(item.medicationDetails)}</p><p className="mt-2 text-xs text-forest">Document: {valueOrNotDocumented(item.document)}</p></div>)}</div></RecordSection><RecordSection title="Medical documents"><div className="space-y-3">{records.documents.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-cream p-4"><div className="flex items-center gap-3"><FileText size={19} /><div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted">{item.type} · {item.date}</p></div></div><button type="button" className="text-sm font-bold text-forest hover:underline">View</button></div>)}</div></RecordSection></div>
    </div>
  );
}

function RecordSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm"><h2 className="mb-5 font-heading text-xl font-bold">{title}</h2>{children}</section>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-sage text-xs uppercase tracking-wide text-muted"><tr>{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-sage">{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-4 text-muted">{cell}</td>)}</tr>)}</tbody></table></div>;
}
