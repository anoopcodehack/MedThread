import { Outlet } from "react-router-dom";
import DoctorHeader from "./DoctorHeader";
import { PlatformFooter } from "../common/PlatformFooter";

export default function DoctorLayout() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 flex flex-col justify-between">
      <div>
        <DoctorHeader />
        <main className="mx-auto max-w-7xl p-5 sm:p-8 w-full">
          <Outlet />
        </main>
      </div>
      <PlatformFooter currentRole="doctor" />
    </div>
  );
}
