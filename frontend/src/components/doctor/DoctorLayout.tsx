import { Outlet } from "react-router-dom";
import DoctorHeader from "./DoctorHeader";
import DoctorSidebar from "./DoctorSidebar";

export default function DoctorLayout() {
  return (
    <div className="flex min-h-screen bg-[#F0F4F8] text-slate-900">
      <DoctorSidebar />
      <div className="min-w-0 flex-1 flex flex-col">
        <DoctorHeader />
        <main className="mx-auto max-w-7xl p-5 sm:p-8 flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
