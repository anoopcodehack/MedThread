
import { Menu, Bell, ChevronDown } from "lucide-react";

interface Props {
  title: string;
  onMenuClick: () => void;
}

export default function PatientHeader({ title, onMenuClick }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E6ECE7] bg-white/95 px-5 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[#164A32] hover:bg-[#EAF1EB] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-[#26352D]">{title}</h2>
          <p className="hidden text-xs text-[#829087] sm:block">
            Your personal health space
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="rounded-full border border-[#E6ECE7] p-2.5 text-[#52705D] hover:bg-[#EAF1EB]"
        >
          <Bell size={18} />
        </button>

        <button className="flex items-center gap-2 rounded-full border border-[#E6ECE7] p-1.5 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF1EB] text-[#164A32]">
            <span className="text-sm font-semibold">?</span>
          </div>
          <span className="hidden text-xs font-medium text-[#26352D] sm:block">
            My Account
          </span>
          <ChevronDown size={15} className="text-[#829087]" />
        </button>
      </div>
    </header>
  );
}
