import { Activity, Clock3, LayoutDashboard, LogOut, ScanLine, UserRound, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";

const links = [
  { to: "/doctor/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/doctor/scan", label: "Scan Patient QR", icon: ScanLine },
  { to: "/doctor/recent-patients", label: "Recent Patients", icon: UsersRound },
  { to: "/doctor/access-history", label: "Access History", icon: Clock3 },
  { to: "/doctor/profile", label: "Profile", icon: UserRound },
];

export default function DoctorSidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-sage bg-white p-5 lg:block">
      <div className="mb-8">
        <BrandLogo theme="dark" size="md" showSubtitle />
      </div>
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-forest text-white" : "text-muted hover:bg-cream hover:text-forest"}`}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 border-t border-sage pt-5">
        <NavLink to="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted hover:bg-cream hover:text-forest"><LogOut size={18} />Logout</NavLink>
      </div>
      <div className="mt-10 rounded-2xl bg-cream p-4 text-xs leading-5 text-muted"><Activity size={18} className="mb-2 text-forest" />Only authorised patient records are available after consent verification.</div>
    </aside>
  );
}
