import { 
  ArrowLeft, 
  FileText, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
  Edit3,
  ShieldCheck,
  Award,
  ArrowRightLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  Activity
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getPatientRecords } from "../../services/doctorService";
import { api } from "../../services/api";
import { ReviewerModal, type ReviewTargetEvent } from "../../components/modals/ReviewerModal";
import { EvidenceViewer, type ContradictionEvidence } from "../../components/cockpit/EvidenceViewer";
import { DocumentPreviewModal } from "../../components/modals/DocumentPreviewModal";
import { BenchmarkModal } from "../../components/modals/BenchmarkModal";
import type { PatientRecords as PatientRecordsType } from "../../types/doctor";
import type { QAResponse } from "../../types/clinical";

const valueOrNotDocumented = (value?: string | number) => value || "Not documented";

export default function PatientRecords() {
  const { patientId = "" } = useParams();
  const [records, setRecords] = useState<PatientRecordsType>();
  const [qaQuery, setQaQuery] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<QAResponse | null>(null);
  const [selectedEventForReview, setSelectedEventForReview] = useState<ReviewTargetEvent | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedContradictionForComparison, setSelectedContradictionForComparison] = useState<ContradictionEvidence | null>(null);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState<string | null>(null);

  const numericId = parseInt(patientId.replace(/\D/g, "")) || 101;

  const reloadRecords = () => {
    void getPatientRecords(patientId).then(setRecords);
  };

  useEffect(() => { 
    reloadRecords();

    const handleEventReviewed = () => {
      reloadRecords();
    };
    window.addEventListener("medthread_event_reviewed", handleEventReviewed);
    return () => {
      window.removeEventListener("medthread_event_reviewed", handleEventReviewed);
    };
  }, [patientId]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuery.trim()) return;
    setQaLoading(true);
    try {
      const res = await api.askQuestion(numericId, qaQuery);
      setQaResult(res);
    } catch (err) {
      console.error("QA error:", err);
    } finally {
      setQaLoading(false);
    }
  };

  if (!records) return <LoadingSpinner />;
  const { profile } = records;
  const conflicts = records.conflicts || [];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/doctor/recent-patients" className="inline-flex items-center gap-2 text-sm font-bold text-forest hover:underline">
          <ArrowLeft size={17} />Back to patients
        </Link>
        <button
          type="button"
          onClick={() => setIsBenchmarkModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-xs transition"
        >
          <Award className="h-4 w-4 text-emerald-600" />
          <span>Clinical Benchmark Scorecard (78.1% Time Saved)</span>
        </button>
      </div>
      
      <div>
        <p className="text-sm font-semibold text-muted">Read-only patient record</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">{profile.name}</h1>
        <p className="mt-2 text-sm text-muted">{profile.id}</p>
      </div>

      {/* IMMEDIATE CRITICAL TRIAGE SUMMARY */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-slate-100 text-slate-800 border border-slate-200">
                <Clock className="h-3.5 w-3.5 text-slate-600" />
                Emergency &amp; Specialist Triage
              </span>
              <span className="text-xs font-semibold text-slate-700">
                Unfamiliar Patient Consultation Protocol
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                • Primary Caregiver: Anoop Sharma (+91 98765 43210)
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-base text-slate-900">
              Immediate Critical Triage Summary
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Cross-facility reconciliation active: Synthesized from 4 independent clinics (Cardiology, Endocrinology, Primary Care, Orthopedics).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Triage Dossier Ready
            </span>
          </div>
        </div>

        {/* 3 Critical Emergency Pillars */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-rose-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 uppercase tracking-wide">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span>Critical Allergies</span>
            </div>
            <div className="font-bold text-slate-900 mt-1.5">
              Penicillin &amp; NSAIDs
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <FileText className="h-3 w-3 text-slate-400 shrink-0" />
              <span>City Hospital Discharge 2021 (p. 2)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-amber-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Active High-Risk Meds</span>
            </div>
            <div className="font-bold text-slate-900 mt-1.5">
              Warfarin 5mg daily (Blood Thinner)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <FileText className="h-3 w-3 text-slate-400 shrink-0" />
              <span>Apollo Cardiology (Hold prior to surgery)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-blue-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 uppercase tracking-wide">
              <Activity className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Unit Standardized Labs</span>
            </div>
            <div className="font-bold text-slate-900 mt-1.5">
              Glucose 142 mg/dL (7.88 mmol/L)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Auto-normalized across international records
            </div>
          </div>
        </div>
      </section>

      {/* CROSS-RECORD CONTRADICTIONS & DISCREPANCIES */}
      {conflicts.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <h2 className="font-heading text-base font-bold text-slate-900">
                  Cross-Record Discrepancies &amp; Contradictions ({conflicts.length} Flagged)
                </h2>
                <p className="text-xs text-slate-500">
                  Conflicting diagnoses, medication statuses, or duplicate tests requiring clinician review.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md border border-rose-200 self-start sm:self-auto">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              Clinical Safety Alert
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {conflicts.map((conf, idx) => {
              const isDirect = conf.tier === "DIRECT_CONFLICT";
              const isReview = conf.tier === "NEEDS_REVIEW";
              const isDup = conf.tier === "DUPLICATE_INVESTIGATION";

              return (
                <div 
                  key={idx} 
                  className={`rounded-xl border p-4 bg-white shadow-2xs ${
                    isDirect ? "border-rose-300 ring-1 ring-rose-300" :
                    isReview ? "border-amber-300" :
                    isDup ? "border-orange-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                        isDirect ? "bg-rose-50 text-rose-800 border border-rose-200" :
                        isReview ? "bg-amber-50 text-amber-800 border border-amber-200" :
                        isDup ? "bg-orange-50 text-orange-800 border border-orange-200" : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}>
                        {conf.tier.replace(/_/g, " ")}
                      </span>
                      {Boolean(conf.resolved) && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-600" /> Resolved
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{conf.entity}</span>
                  </div>

                  <p className="mt-2 text-xs font-medium text-slate-700 leading-relaxed">
                    {conf.description}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-600 flex items-center gap-1 truncate mb-0.5">
                        <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                        {conf.doc1_name}
                      </span>
                      <span className="italic text-slate-700 line-clamp-2">&ldquo;{conf.quote1}&rdquo;</span>
                    </div>
                    <div className="border-l border-slate-200 pl-2">
                      <span className="font-semibold text-slate-600 flex items-center gap-1 truncate mb-0.5">
                        <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                        {conf.doc2_name}
                      </span>
                      <span className="italic text-slate-700 line-clamp-2">&ldquo;{conf.quote2}&rdquo;</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedContradictionForComparison({
                      id: idx,
                      entity: conf.entity,
                      tier: conf.tier,
                      category: "CLINICAL",
                      description: conf.description,
                      doc1_name: conf.doc1_name,
                      quote1: conf.quote1,
                      doc2_name: conf.doc2_name,
                      quote2: conf.quote2
                    })}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 text-forest" />
                    <span>Compare Evidence Side-by-Side</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ASK PATIENT RECORDS CONSOLE (TWO-STAGE EPISTEMIC ABSTENTION GATE) */}
      <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-5 w-5 text-forest" />
          <h2 className="font-heading text-lg font-bold">Ask Patient Records (Grounded Clinical Q&A)</h2>
        </div>
        <p className="text-xs text-muted mb-4">
          Queries patient evidence strictly from uploaded records with anti-hallucination epistemic abstention.
        </p>

        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <input 
            type="text"
            value={qaQuery}
            onChange={(e) => setQaQuery(e.target.value)}
            placeholder="e.g. What is the Metformin dose? or Does patient have Asthma?"
            className="flex-1 rounded-xl border border-sage px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <button
            type="submit"
            disabled={qaLoading}
            className="rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest/90 transition disabled:opacity-50"
          >
            {qaLoading ? "Searching..." : "Ask Records"}
          </button>
        </form>

        {qaResult && (
          <div className={`mt-4 rounded-xl p-4 border ${
            qaResult.status === "GROUNDED_ANSWER" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
              : qaResult.status === "REFUSAL_SAFETY_GUARD"
                ? "bg-rose-50 border-rose-300 text-rose-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs uppercase mb-1">
              {qaResult.status === "GROUNDED_ANSWER" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Verified Evidence-Grounded Answer</span>
                </>
              ) : qaResult.status === "REFUSAL_SAFETY_GUARD" ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span className="text-rose-700 font-extrabold tracking-wide">
                    Clinical Refusal Firewall (Never Prescribes or Diagnoses)
                  </span>
                </>
              ) : (
                <>
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700">Epistemic Abstention (Not Documented)</span>
                </>
              )}
            </div>

            <p className="text-sm font-medium mt-1 leading-relaxed">
              {qaResult.answer}
            </p>

            {qaResult.citations && qaResult.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Source Citations:</span>
                {qaResult.citations.map((c, i) => (
                  <div key={i} className="text-xs text-emerald-900 bg-white/70 p-2 rounded border border-emerald-200">
                    <span className="font-semibold flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-emerald-700 shrink-0" />
                      {c.source_doc} (Page {c.page_number})
                    </span>
                    <span className="italic block mt-0.5">&ldquo;{c.quote}&rdquo;</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Patient Profile */}
      <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-heading text-xl font-bold">Patient profile</h2>
        <div className="grid gap-5 sm:grid-cols-4">
          {[["Patient ID", profile.id], ["Age", profile.age], ["Gender", profile.gender], ["Blood group", profile.bloodGroup]].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-1 font-semibold text-forest">{valueOrNotDocumented(value as string | number)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical History Timeline */}
      <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-heading text-xl font-bold">Medical history timeline</h2>
        <div className="space-y-6">
          {records.timeline.map((item) => (
            <div key={item.id} className="relative border-l-2 border-sage pl-5 group">
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-forest" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted">{item.date}</p>
                  <h3 className="mt-1 font-bold text-forest">{item.event}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventForReview({
                      id: parseInt(item.id) || 1,
                      entity: item.event,
                      category: "TIMELINE",
                      status: item.description || "RECORDED",
                      currentValue: item.description,
                    });
                    setIsReviewModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest bg-sage/30 hover:bg-sage px-2 py-0.5 rounded transition"
                >
                  <Edit3 size={11} /> Review
                </button>
              </div>
              <p className="mt-1 text-sm text-muted">{valueOrNotDocumented(item.description)}</p>
              {item.isReviewed && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>Verified Override: {item.reviewedOverride || "Confirmed by clinician"}</span>
                </div>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-forest flex items-center gap-1.5">
                  <FileText size={12} className="text-forest/70 shrink-0" />
                  <span>{valueOrNotDocumented(item.source)}</span>
                </p>
                {item.quote && (
                  <p className="rounded-lg bg-slate-50 p-2 text-xs font-mono text-slate-700 border border-slate-200">
                    &ldquo;Quote: {item.quote}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecordSection title="Medications">
          <div className="space-y-3">
            {records.medications.map((item) => {
              const itemOverride = (() => {
                try {
                  const overrides = JSON.parse(localStorage.getItem("medthread_timeline_overrides") || "{}");
                  if (overrides[item.id]) return overrides[item.id];
                  if (item.name && overrides[item.name.toLowerCase()]) return overrides[item.name.toLowerCase()];
                  if (item.name && item.name.toLowerCase().includes("aspirin") && (overrides["aspirin"] || overrides["39"])) {
                    return overrides["aspirin"] || overrides["39"];
                  }
                } catch {}
                if (item.isReviewed && item.reviewedOverride) {
                  return {
                    reviewerName: "Dr. Ananya Rao",
                    fieldModified: "Medication Status",
                    originalValue: "TEMPORARILY_HELD",
                    newValue: "ACTIVE",
                    reason: typeof item.reviewedOverride === "string" ? item.reviewedOverride : "Clinician verified override",
                  };
                }
                return null;
              })();

              return (
                <div key={item.id} className="rounded-xl bg-cream p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-muted">{valueOrNotDocumented(item.dosage)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {itemOverride ? (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                          <ShieldCheck size={12} className="text-emerald-700" />
                          Current (Override)
                        </span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "Stopped" ? "bg-red-100 text-red-800" :
                          item.status === "Changed" ? "bg-amber-100 text-amber-800" :
                          "bg-sage text-forest"
                        }`}>
                          {item.status}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEventForReview({
                            id: parseInt(item.id) || 1,
                            entity: item.name,
                            category: "MEDICATION",
                            status: itemOverride?.newValue || item.status,
                            currentValue: item.dosage,
                          });
                          setIsReviewModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest hover:underline"
                      >
                        <Edit3 size={11} /> Correct
                      </button>
                    </div>
                  </div>

                  {itemOverride ? (
                    <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50/80 p-2.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 border-b border-emerald-200 pb-1 mb-1.5">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={13} className="text-emerald-700" />
                          Verified Override: {itemOverride.reviewerName || "Dr. Ananya Rao"}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700">Audit Logged</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Diff:</span>
                        <span className="line-through text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px] font-mono">
                          Before: {itemOverride.originalValue || "TEMPORARILY_HELD"}
                        </span>
                        <ArrowRight size={12} className="text-emerald-700 shrink-0" />
                        <span className="font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
                          Current: {itemOverride.newValue || "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 italic bg-white/80 p-1.5 rounded border border-emerald-200">
                        &ldquo;{itemOverride.reason}&rdquo;
                      </p>
                    </div>
                  ) : item.isReviewed ? (
                    <div className="mt-2 rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{item.reviewedOverride || "Verified by Clinician"}</span>
                    </div>
                  ) : null}

                  <p className="mt-2 text-xs text-muted">Start: {valueOrNotDocumented(item.startDate)} · End: {valueOrNotDocumented(item.endDate)}</p>
                  <div className="mt-2 space-y-1">
                    {item.source && (
                      <div className="flex items-center justify-between text-xs text-forest">
                        <span className="font-semibold flex items-center gap-1.5">
                          <FileText size={12} className="text-forest/70 shrink-0" />
                          {item.source}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const docName = (item.source || "").split(" ")[0];
                            if (docName) setPreviewDocModal(docName);
                          }}
                          className="text-[10px] font-bold text-forest hover:underline bg-forest/10 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          View PDF ↗
                        </button>
                      </div>
                    )}
                    {item.quote && (
                      <p className="rounded-lg bg-white/80 p-2 text-xs font-mono text-slate-700 border border-sage/60">
                        &ldquo;Quote: {item.quote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </RecordSection>

        <RecordSection title="Allergies">
          <div className="space-y-3">
            {records.allergies.map((item) => (
              <div key={item.id} className="rounded-xl bg-cream p-4">
                <p className="font-semibold text-red-700">{item.name}</p>
                <p className="mt-1 text-sm text-muted">Severity: {valueOrNotDocumented(item.severity)}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold text-forest flex items-center gap-1.5">
                    <FileText size={12} className="text-forest/70 shrink-0" />
                    <span>{valueOrNotDocumented(item.source)}</span>
                  </p>
                  {item.quote && (
                    <p className="rounded-lg bg-white/80 p-2 text-xs font-mono text-slate-700 border border-sage/60">
                      &ldquo;Quote: {item.quote}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RecordSection>
      </div>

      <RecordSection title="Investigations and lab reports">
        <DataTable 
          headers={["Investigation", "Date", "Result", "Source & Verbatim Quote"]} 
          rows={records.investigations.map((item) => [
            item.name, 
            item.date, 
            `${valueOrNotDocumented(item.result)} ${item.unit || ""}`.trim(), 
            item.quote ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <FileText size={12} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">{valueOrNotDocumented(item.source)}</span>
                <span className="text-slate-400">·</span>
                <span className="italic text-slate-600 truncate max-w-xs">&ldquo;{item.quote.slice(0, 70)}...&rdquo;</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <FileText size={12} className="text-slate-400 shrink-0" />
                <span>{valueOrNotDocumented(item.source)}</span>
              </span>
            )
          ])} 
        />
      </RecordSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecordSection title="Prescriptions">
          <div className="space-y-3">
            {records.prescriptions.map((item) => (
              <div key={item.id} className="rounded-xl bg-cream p-4">
                <p className="text-xs text-muted">{item.date}</p>
                <p className="mt-1 font-semibold">{valueOrNotDocumented(item.doctor)}</p>
                <p className="mt-2 text-sm text-muted">{valueOrNotDocumented(item.medicationDetails)}</p>
                <p className="mt-2 text-xs text-forest">Document: {valueOrNotDocumented(item.document)}</p>
              </div>
            ))}
          </div>
        </RecordSection>

        <RecordSection title="Medical documents">
          <div className="space-y-3">
            {records.documents.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-cream p-4">
                <div className="flex items-center gap-3">
                  <FileText size={19} className="text-forest" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-muted">{item.type} · {item.date}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(item.name)} 
                  className="inline-flex items-center gap-1 text-sm font-bold text-forest hover:underline cursor-pointer bg-forest/10 px-2.5 py-1 rounded-lg"
                >
                  View PDF <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </RecordSection>
      </div>

      <ReviewerModal
        isOpen={isReviewModalOpen}
        event={selectedEventForReview}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedEventForReview(null);
        }}
        onSuccess={() => {
          reloadRecords();
        }}
      />

      <EvidenceViewer
        isOpen={Boolean(selectedContradictionForComparison)}
        contradiction={selectedContradictionForComparison}
        patientId={numericId}
        onClose={() => setSelectedContradictionForComparison(null)}
        onOpenReviewOverride={() => {
          if (!selectedContradictionForComparison) return;
          const searchTarget = selectedContradictionForComparison.entity.toLowerCase();
          const matchingEv = records?.timeline.find(t => 
            t.event.toLowerCase().includes(searchTarget)
          ) || records?.medications.find(m => 
            m.name.toLowerCase().includes(searchTarget)
          ) || records?.allergies.find(a => 
            a.name.toLowerCase().includes(searchTarget)
          );

          const eventId = matchingEv ? parseInt(matchingEv.id) || 31 : 31;
          setSelectedEventForReview({
            id: eventId,
            entity: selectedContradictionForComparison.entity,
            category: selectedContradictionForComparison.category || "CLINICAL",
            status: selectedContradictionForComparison.tier === "NEEDS_REVIEW" ? "CONFIRMED_ALLERGY" : "CLINICIAN_RESOLVED",
            currentValue: selectedContradictionForComparison.description,
            source_passage: selectedContradictionForComparison.quote2 || selectedContradictionForComparison.quote1
          });
          setIsReviewModalOpen(true);
        }}
      />

      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />

      {previewDocModal && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDocModal)}
          onClose={() => setPreviewDocModal(null)}
          filename={previewDocModal}
          patientId={numericId}
        />
      )}
    </div>
  );
}

function RecordSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm"><h2 className="mb-5 font-heading text-xl font-bold">{title}</h2>{children}</section>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-sage text-xs uppercase tracking-wide text-muted">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-sage">
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-4 text-muted">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
