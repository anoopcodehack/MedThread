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
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";

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
  { id: "dashboard" as const, label: "Overview", icon: LayoutDashboard },
  { id: "history" as const, label: "Medical History", icon: History },
  { id: "conditions" as const, label: "Conditions & Diagnoses", icon: ClipboardList },
  { id: "medications" as const, label: "Medications", icon: Pill },
  { id: "investigations" as const, label: "Tests & Investigations", icon: Activity },
  { id: "visits" as const, label: "Visits & Procedures", icon: Hospital },
  { id: "documents" as const, label: "Medical Documents", icon: FolderOpen },
  { id: "access" as const, label: "Share & Access", icon: Share2 },
  { id: "profile" as const, label: "Profile", icon: HeartPulse },
];

export default function PatientSidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
}: Props) {
  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-6">
          <BrandLogo theme="dark" size="md" showSubtitle />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-cream lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-forest text-white shadow-xs"
                    : "text-muted hover:bg-cream hover:text-forest"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-6">
        <div className="border-t border-sage pt-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted transition hover:bg-cream hover:text-forest"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-sage/50 bg-cream p-4 text-xs leading-5 text-muted">
          <ShieldCheck size={18} className="mb-2 text-forest" />
          Evidence-first records with strict passage grounding and patient isolation.
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden min-h-screen w-64 shrink-0 border-r border-sage bg-white p-5 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-sage bg-white p-5 transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
