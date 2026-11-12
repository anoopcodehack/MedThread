
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import PatientSidebar, {
  type PatientPage,
} from "../../components/patient/PatientSidebar";
import PatientHeader from "../../components/patient/PatientHeader";
import PatientDashboard from "./PatientDashboard";
import MedicalHistoryPage from "./MedicalHistoryPage";
import PatientDocumentsPage from "./PatientDocumentsPage";
import PatientSectionPage from "./PatientSectionPage";
import { api } from "../../services/api";
import type { PatientSummary } from "../../types/clinical";

interface Props {
  patientId?: number;
}

type PatientListState = "loading" | "ready" | "error";
type SeedState = "idle" | "loading" | "success" | "error";

const pageTitles: Record<PatientPage, string> = {
  dashboard: "Dashboard",
  history: "Complete Medical History",
  conditions: "Conditions & Diagnoses",
  medications: "Medications",
  investigations: "Tests & Investigations",
  visits: "Visits & Procedures",
  documents: "Medical Documents",
  access: "Share & Access",
  profile: "Profile & Caregivers",
};

export default function PatientPortal({ patientId }: Props) {
  const [activePage, setActivePage] = useState<PatientPage>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(
    patientId,
  );
  const [patientListState, setPatientListState] =
    useState<PatientListState>("loading");
  const [patientListError, setPatientListError] = useState("");
  const [patientListRetry, setPatientListRetry] = useState(0);
  const [seedState, setSeedState] = useState<SeedState>("idle");
  const [seedMessage, setSeedMessage] = useState("");
  const [dataRevision, setDataRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setPatientListState("loading");
    setPatientListError("");

    api
      .getPatients()
      .then((items) => {
        if (!active) return;
        setPatients(items);
        setSelectedPatientId((current) => {
          const preferredId = patientId ?? current;
          return preferredId !== undefined &&
            items.some((patient) => patient.id === preferredId)
            ? preferredId
            : undefined;
        });
        setPatientListState("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setPatientListError(
          reason instanceof Error ? reason.message : "Unable to load patients.",
        );
        setPatientListState("error");
      });

    return () => {
      active = false;
    };
  }, [patientId, patientListRetry]);

  async function seedSelectedPatient() {
    if (selectedPatientId === undefined) return;

    setSeedState("loading");
    setSeedMessage("");
    try {
      const result = await api.seedPatientData(selectedPatientId);
      setSeedMessage(
        `Backend seeded ${result.documents_ingested} document(s). It reports ${result.total_events} event(s) and ${result.conflicts_detected} conflict(s).`,
      );
      setSeedState("success");
      setDataRevision((revision) => revision + 1);
    } catch (reason) {
      setSeedMessage(
        reason instanceof Error
          ? reason.message
          : "The backend could not seed this patient.",
      );
      setSeedState("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      <PatientSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:pl-[270px]">
        <PatientHeader
          title={pageTitles[activePage]}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="mx-auto max-w-[1500px] p-5 md:p-8">
          <section className="mb-6 rounded-2xl border border-[#DCE8DE] bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#EAF1EB] p-2.5 text-[#164A32]">
                  <Database size={21} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#26352D]">
                    Demo patient selection
                  </h2>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-[#718077]">
                    Select a patient returned by the backend. This demo route
                    is directly accessible without login; use synthetic
                    records only.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="sr-only" htmlFor="patient-selection">
                  Select backend patient
                </label>
                <select
                  id="patient-selection"
                  value={selectedPatientId ?? ""}
                  disabled={patientListState !== "ready"}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedPatientId(value ? Number(value) : undefined);
                    setSeedState("idle");
                    setSeedMessage("");
                  }}
                  className="min-w-56 rounded-xl border border-[#DCE5DA] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#719777] focus:ring-2 focus:ring-[#719777]/20 disabled:bg-[#F7F9F7]"
                >
                  <option value="">
                    {patientListState === "loading"
                      ? "Loading patients…"
                      : "Select a patient"}
                  </option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} · {patient.external_id}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={seedSelectedPatient}
                  disabled={
                    selectedPatientId === undefined ||
                    seedState === "loading" ||
                    patientListState !== "ready"
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#164A32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#082818] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {seedState === "loading" ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Database size={16} aria-hidden="true" />
                  )}
                  {seedState === "loading"
                    ? "Seeding…"
                    : "Load synthetic records"}
                </button>
              </div>
            </div>

            {patientListState === "error" && (
              <div
                role="alert"
                className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
              >
                <span>{patientListError}</span>
                <button
                  type="button"
                  onClick={() => setPatientListRetry((count) => count + 1)}
                  className="inline-flex items-center gap-2 font-semibold underline underline-offset-2"
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}

            {seedMessage && (
              <p
                role={seedState === "error" ? "alert" : "status"}
                className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm ${
                  seedState === "error"
                    ? "border border-rose-200 bg-rose-50 text-rose-800"
                    : "border border-[#C7D9CB] bg-[#F1F6F1] text-[#164A32]"
                }`}
              >
                {seedState === "error" ? (
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                )}
                {seedMessage}
              </p>
            )}

            {patientListState === "ready" && patients.length === 0 && (
              <p className="mt-3 text-sm text-[#718077]">
                The backend returned no patients.
              </p>
            )}
          </section>

          {activePage === "dashboard" ? (
            <PatientDashboard
              patientId={selectedPatientId}
              onUploadSuccess={() => setDataRevision((r) => r + 1)}
              onNavigate={(page) => setActivePage(page as PatientPage)}
            />
          ) : activePage === "history" ? (
            <MedicalHistoryPage
              key={`${selectedPatientId ?? "none"}-${dataRevision}`}
              patientId={selectedPatientId}
            />
          ) : activePage === "documents" ? (
            <PatientDocumentsPage
              key={`${selectedPatientId ?? "none"}-${dataRevision}`}
              patientId={selectedPatientId}
            />
          ) : (
            <PatientSectionPage
              key={`${activePage}-${selectedPatientId ?? "none"}-${dataRevision}`}
              page={activePage}
              patientId={selectedPatientId}
            />
          )}
        </main>
      </div>
    </div>
  );
}
