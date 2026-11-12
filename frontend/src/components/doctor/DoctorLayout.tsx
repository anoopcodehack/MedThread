import { Outlet } from "react-router-dom";
import DoctorHeader from "./DoctorHeader";
import DoctorSidebar from "./DoctorSidebar";

export default function DoctorLayout() {
  return <div className="flex min-h-screen bg-cream text-forest"><DoctorSidebar /><div className="min-w-0 flex-1"><DoctorHeader /><main className="mx-auto max-w-7xl p-5 sm:p-8"><Outlet /></main></div></div>;
}
