import { Bell, Menu, UserRound } from "lucide-react";

interface Props {
  title: string;
  onMenuClick: () => void;
  patientName?: string;
  patientExternalId?: string;
}

export default function PatientHeader({
  title,
  onMenuClick,
  patientName = "Rajesh Sharma",
  patientExternalId = "PAT-101",
}: Props) {
  return (
    <header className="flex items-center justify-between border-b border-sage bg-white px-5 py-4 sm:px-8">
      <button
        onClick={onMenuClick}
        type="button"
        className="text-muted hover:text-forest lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Patient workspace
        </p>
        <p className="font-heading text-lg font-bold text-forest">
          {title || "Personal health records"}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          className="text-muted hover:text-forest transition"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm font-semibold text-forest">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage">
            <UserRound size={18} />
          </span>
          <span className="hidden sm:inline">
            {patientName} ({patientExternalId})
          </span>
        </div>
      </div>
    </header>
  );
}
