import { useEffect, useState } from "react";
import type { PatientPage } from "../../components/patient/PatientSidebar";
import PatientHeader from "../../components/patient/PatientHeader";
import { PlatformFooter } from "../../components/common/PlatformFooter";
import PatientDashboard from "./PatientDashboard";
import MedicalHistoryPage from "./MedicalHistoryPage";
import PatientDocumentsPage from "./PatientDocumentsPage";
import PatientSectionPage from "./PatientSectionPage";
import { api } from "../../services/api";
import type { PatientSummary } from "../../types/clinical";

interface Props {
  patientId?: number;
}

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

const KNOWN_PATIENTS: Record<number, { name: string; external_id: string }> = {
  101: { name: "Rajesh Sharma", external_id: "PAT-101" },
  102: { name: "Priya Patel", external_id: "PAT-102" },
  103: { name: "Vikram Malhotra", external_id: "PAT-103" },
  104: { name: "Mohammed Irfan", external_id: "PAT-104" },
  105: { name: "David Fernandes", external_id: "PAT-105" },
};

export default function PatientPortal({ patientId }: Props) {
  const [activePage, setActivePage] = useState<PatientPage>("dashboard");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [dataRevision, setDataRevision] = useState(0);

  // Authenticated patient ID from props or session storage - strictly isolated to this patient!
  const storedId =
    typeof window !== "undefined"
      ? Number(sessionStorage.getItem("medthread.authenticatedPatientId"))
      : undefined;
  const effectivePatientId =
    patientId || (storedId && !isNaN(storedId) ? storedId : 101);

  useEffect(() => {
    let active = true;
    api
      .getPatients()
      .then((items) => {
        if (!active) return;
        setPatients(items);
      })
      .catch((err) => {
        console.warn("Unable to fetch patient roster:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const defaultPatient =
    KNOWN_PATIENTS[effectivePatientId] || KNOWN_PATIENTS[101];
  const currentPatient = patients.find((p) => p.id === effectivePatientId);
  const patientName = currentPatient ? currentPatient.name : defaultPatient.name;
  const patientExternalId = currentPatient
    ? currentPatient.external_id
    : defaultPatient.external_id;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 flex flex-col justify-between">
      <div>
        <PatientHeader
          title={pageTitles[activePage]}
          patientName={patientName}
          patientExternalId={patientExternalId}
          activePage={activePage}
          onNavigate={setActivePage}
        />

        <main className="mx-auto max-w-7xl p-5 sm:p-8">
          {activePage === "dashboard" ? (
            <PatientDashboard
              key={`${effectivePatientId}-${dataRevision}`}
              patientId={effectivePatientId}
              onUploadSuccess={() => setDataRevision((r) => r + 1)}
              onNavigate={(page) => setActivePage(page as PatientPage)}
            />
          ) : activePage === "history" ? (
            <MedicalHistoryPage
              key={`${effectivePatientId}-${dataRevision}`}
              patientId={effectivePatientId}
            />
          ) : activePage === "documents" ? (
            <PatientDocumentsPage
              key={`${effectivePatientId}-${dataRevision}`}
              patientId={effectivePatientId}
            />
          ) : (
            <PatientSectionPage
              key={`${activePage}-${effectivePatientId}-${dataRevision}`}
              page={activePage}
              patientId={effectivePatientId}
            />
          )}
        </main>
      </div>

      <PlatformFooter currentRole="patient" />
    </div>
  );
}
