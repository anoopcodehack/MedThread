
import {
  LayoutDashboard,
  History,
  ClipboardList,
  Pill,
  Activity,
  Hospital,
  FolderOpen,
  Share2,
  HeartPulse,
  X,
} from "lucide-react";

export type PatientPage =
  | "dashboard"
  | "history"
  | "conditions"
  | "medications"
  | "investigations"
  | "visits"
  | "documents"
  | "access"
  | "profile";

interface Props {
  activePage: PatientPage;
  onNavigate: (page: PatientPage) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "history", label: "Medical History", icon: History },
  { id: "conditions", label: "Conditions & Diagnoses", icon: ClipboardList },
  { id: "medications", label: "Medications", icon: Pill },
  { id: "investigations", label: "Tests & Investigations", icon: Activity },
  { id: "visits", label: "Visits & Procedures", icon: Hospital },
  { id: "documents", label: "Medical Documents", icon: FolderOpen },
  { id: "access", label: "Share & Access", icon: Share2 },
  { id: "profile", label: "Profile & Caregivers", icon: HeartPulse },
] as const;

export default function PatientSidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
}: Props) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col
        bg-[#082818] text-white transition-transform duration-300
        lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B5CCB8] text-[#082818]">
              <HeartPulse size={23} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">MedThread</h1>
              <p className="text-[10px] tracking-[2px] text-[#B5CCB8]">
                PATIENT PORTAL
              </p>
            </div>
          </div>

          <button onClick={onClose} className="lg:hidden" aria-label="Close">
            <X size={21} />
          </button>
        </div>

        <div className="px-5 pb-2 pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#91B49D]">
            Workspace
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition
                  ${
                    active
                      ? "bg-[#B5CCB8] font-semibold text-[#082818] shadow-sm"
                      : "text-[#D6E5D9] hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-5">
          <p className="text-xs leading-5 text-[#B5CCB8]">
            Your medical history, organized in one place.
          </p>
          <p className="mt-2 text-[10px] text-white/40">
            MEDTHREAD · PATIENT PORTAL
          </p>
        </div>
      </aside>
    </>
  );
}
