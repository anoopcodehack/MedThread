
import { useState } from "react";
import PatientSidebar, {
  type PatientPage,
} from "../../components/patient/PatientSidebar";
import PatientHeader from "../../components/patient/PatientHeader";
import PatientDashboard from "./PatientDashboard";
import MedicalHistoryPage from "./MedicalHistoryPage";
import PatientSectionPage from "./PatientSectionPage";

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

export default function PatientPortal({ patientId }: Props) {
  const [activePage, setActivePage] = useState<PatientPage>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

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
          {activePage === "dashboard" ? (
            <PatientDashboard
              onNavigate={(page) => setActivePage(page as PatientPage)}
            />
          ) : activePage === "history" ? (
            <MedicalHistoryPage patientId={patientId} />
          ) : (
            <PatientSectionPage
              key={activePage}
              page={activePage}
              patientId={patientId}
            />
          )}
        </main>
      </div>
    </div>
  );
}
