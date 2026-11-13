import { useState, useRef, useEffect } from "react";
import {
  UserRound,
  LogOut,
  Bell,
  History,
  ClipboardList,
  Pill,
  Activity,
  Hospital,
  FolderOpen,
  Camera,
  ShieldCheck,
  CheckCheck,
  ArrowRight,
  Clock,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";
import type { PatientPage } from "./PatientSidebar";

interface Props {
  title?: string;
  patientName?: string;
  patientExternalId?: string;
  activePage?: PatientPage;
  onNavigate?: (page: PatientPage) => void;
}

export interface PatientNotification {
  id: string;
  type: string;
  title: string;
  doctor: string;
  facility: string;
  entity: string;
  field: string;
  beforeValue: string;
  afterValue: string;
  reason: string;
  timestamp: string;
  read: boolean;
  eventId?: number;
}

const DEFAULT_PATIENT_NOTIFICATIONS: PatientNotification[] = [
  {
    id: "notif-init-1",
    type: "CLINICAL_OVERRIDE",
    title: "Clinician Prescription Override Verified",
    doctor: "Dr. Ananya Rao",
    facility: "Apollo Heart Institute",
    entity: "Aspirin 75mg",
    field: "Medication Status",
    beforeValue: "TEMPORARILY HELD",
    afterValue: "ACTIVE",
    reason: "Verified with patient and clinical consultation note: surgical site healed, resuming cardiac prophylaxis.",
    timestamp: "10 mins ago",
    read: false,
    eventId: 39,
  },
];

export default function PatientHeader({
  activePage = "dashboard",
  onNavigate,
}: Props) {
  const [openDropdown, setOpenDropdown] = useState<"records" | "documents" | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<PatientNotification[]>(() => {
    try {
      const stored = localStorage.getItem("medthread_patient_notifications");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return DEFAULT_PATIENT_NOTIFICATIONS;
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  // Sync notifications from localStorage and listen to real-time custom event
  useEffect(() => {
    const handleNewNotif = (e: any) => {
      if (e.detail) {
        setNotifications((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener("medthread_notification_added", handleNewNotif);
    
    // Close notifications popover on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("medthread_notification_added", handleNewNotif);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem("medthread_patient_notifications", JSON.stringify(updated));
    } catch {}
  };

  const handleMouseEnter = (menu: "records" | "documents") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const isRecordsActive = [
    "history",
    "conditions",
    "medications",
    "investigations",
    "visits",
  ].includes(activePage);

  const isDocsActive = ["documents"].includes(activePage);

  // Exactly ONE active dot indicator: shows under hovered menu if open, otherwise under active page
  const activeDot: "dashboard" | "records" | "documents" | "access" | null =
    openDropdown === "records"
      ? "records"
      : openDropdown === "documents"
      ? "documents"
      : activePage === "dashboard"
      ? "dashboard"
      : isRecordsActive
      ? "records"
      : isDocsActive
      ? "documents"
      : activePage === "access"
      ? "access"
      : null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl w-full mx-auto px-6 py-3.5 flex items-center justify-between gap-6 relative">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group" title="Return to MedThread Home">
              <BrandLogo theme="dark" size="md" showSubtitle />
            </Link>
          </div>

          {/* Center: Mega-Menu Top Navigation (No chevron/arrow symbols in navbar) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-700">
            {/* 1. Overview Direct Link */}
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                onNavigate?.("dashboard");
              }}
              className={`transition flex flex-col items-center py-1 font-bold ${
                activePage === "dashboard"
                  ? "text-forest"
                  : "text-slate-600 hover:text-forest"
              }`}
            >
              <span>Overview</span>
              {activeDot === "dashboard" && (
                <span className="w-1.5 h-1.5 bg-forest rounded-xs mt-1 block" />
              )}
            </button>

            {/* 2. Clinical Records Mega-Menu Hover Dropdown (Clean text, no > or chevron) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("records")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => onNavigate?.("history")}
                className={`flex flex-col items-center py-1 font-bold transition ${
                  isRecordsActive || openDropdown === "records"
                    ? "text-forest"
                    : "text-slate-600 hover:text-forest"
                }`}
              >
                <span>Clinical Records</span>
                {activeDot === "records" && (
                  <span className="w-1.5 h-1.5 bg-forest rounded-xs mt-1 block" />
                )}
              </button>

              {/* Mega-Menu Flyout (Clean 3-column layout without information overload) */}
              {openDropdown === "records" && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[720px] rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-left"
                  onMouseEnter={() => handleMouseEnter("records")}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Col 1: Spotlight (Left Column) */}
                  <div className="col-span-4 pr-3 border-r border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Longitudinal History
                      </span>
                      <h4 className="font-heading font-extrabold text-sm text-slate-900 mt-2">
                        Evidence-First Records
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                        Chronological patient journey unified across hospitals with verified citations.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate?.("history");
                      }}
                      className="text-xs font-bold text-forest hover:underline mt-4 pt-2 border-t border-slate-100 text-left block"
                    >
                      Explore Full Timeline
                    </button>
                  </div>

                  {/* Col 2: Category Links (Middle Column) */}
                  <div className="col-span-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                      Explore Categories
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate?.("history");
                      }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <History size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          Medical History
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Chronological timeline
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate?.("conditions");
                      }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <ClipboardList size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          Conditions &amp; Diagnoses
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Verified diagnoses
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate?.("medications");
                      }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <Pill size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          Medications &amp; Doses
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Active prescriptions
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate?.("investigations");
                      }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <Activity size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          Tests &amp; Lab Panels
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Standardized labs
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate?.("visits");
                      }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <Hospital size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          Visits &amp; Procedures
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Hospital encounters
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Col 3: Visual Feature Card (Right Column - NO AI icons, clean & uncluttered) */}
                  <div className="col-span-4 pl-3 border-l border-slate-100 flex flex-col justify-between">
                    <div className="rounded-xl bg-gradient-to-br from-[#0B2818] via-[#0E351F] to-[#082214] p-4 text-white flex flex-col justify-between h-full shadow-sm">
                      <div>
                        <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                          <Hospital size={13} />
                          <span>Multi-Hospital Ingestion</span>
                        </div>
                        <h5 className="font-heading font-extrabold text-xs text-white mt-2 leading-snug">
                          Multi-Hospital Stitched Records
                        </h5>
                        <p className="text-[11px] text-white/75 mt-1.5 leading-relaxed">
                          Replaces crumpled paper files with verified digital records in seconds.
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-white/15 flex items-center justify-between text-[10px] font-semibold text-emerald-300">
                        <span>Standardized Units</span>
                        <span>NABH Grounded</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Documents Dropdown (Clean text, no > or chevron) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("documents")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => onNavigate?.("documents")}
                className={`flex flex-col items-center py-1 font-bold transition ${
                  isDocsActive || openDropdown === "documents"
                    ? "text-forest"
                    : "text-slate-600 hover:text-forest"
                }`}
              >
                <span>Documents</span>
                {activeDot === "documents" && (
                  <span className="w-1.5 h-1.5 bg-forest rounded-xs mt-1 block" />
                )}
              </button>

              {/* Documents Menu Flyout */}
              {openDropdown === "documents" && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-left"
                  onMouseEnter={() => handleMouseEnter("documents")}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate?.("documents");
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <FolderOpen size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Medical Documents
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        View parsed PDF &amp; image files
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate?.("dashboard");
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <Camera size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Prescription Scanner
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Snap paper prescriptions live
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Emergency Access Direct Link */}
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                onNavigate?.("access");
              }}
              className={`transition flex flex-col items-center py-1 font-bold ${
                activePage === "access"
                  ? "text-forest"
                  : "text-slate-600 hover:text-forest"
              }`}
            >
              <span>Emergency Access</span>
              {activeDot === "access" && (
                <span className="w-1.5 h-1.5 bg-forest rounded-xs mt-1 block" />
              )}
            </button>
          </nav>

          {/* Right: Notifications, Profile Icon Only (Opens Profile on Click), & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications with Real-Time Clinician Update Badge & Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl transition ${
                  isNotifOpen
                    ? "bg-slate-100 text-forest"
                    : "text-slate-500 hover:text-forest hover:bg-slate-100"
                }`}
                aria-label="Clinician updates and audit alerts"
                title="Clinician updates and prescription audits"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute 1 top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-forest/10 text-forest">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-xs text-slate-900">
                          Clinician Record Updates
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Direct evidence audits &amp; doctor overrides
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-forest hover:underline flex items-center gap-1"
                      >
                        <CheckCheck size={12} />
                        Mark read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No new clinician updates. All records are currently synchronized.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 transition hover:bg-slate-50/80 ${
                            !notif.read ? "bg-emerald-50/20" : ""
                          }`}
                        >
                          {/* Doctor & Facility */}
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <Stethoscope size={13} className="text-forest" />
                              {notif.doctor}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock size={11} />
                              {notif.timestamp}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 mb-2 font-medium">
                            {notif.facility} · Overrode <strong className="text-slate-800">{notif.entity}</strong>
                          </p>

                          {/* Visual Before vs Current Diff Box */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 mb-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Clinical Audit Diff ({notif.field}):
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="line-through text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
                                Before: {notif.beforeValue}
                              </span>
                              <ArrowRight size={13} className="text-slate-400 shrink-0" />
                              <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono">
                                Current: {notif.afterValue}
                              </span>
                            </div>
                          </div>

                          {/* Justification note */}
                          <p className="text-[11px] text-slate-600 italic bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 mb-2.5">
                            &ldquo;{notif.reason}&rdquo;
                          </p>

                          {/* Action button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotifOpen(false);
                              onNavigate?.("medications");
                            }}
                            className="text-xs font-bold text-forest hover:text-emerald-700 flex items-center gap-1 group"
                          >
                            <span>Inspect in Medical Timeline</span>
                            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Icon Only: Clicking this opens Profile & Caregivers page */}
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                onNavigate?.("profile");
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition shadow-xs ${
                activePage === "profile"
                  ? "bg-forest text-white border-forest ring-2 ring-forest/30"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              }`}
              title="Open Profile & Caregivers"
              aria-label="Open Profile & Caregivers"
            >
              <UserRound size={17} />
            </button>

            {/* Logout Button (Dark Green Pill Style from Landing Page) */}
            <Link
              to="/"
              className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md transition-all transform hover:scale-105 uppercase tracking-wider flex items-center gap-1.5"
              title="Logout from Patient Portal"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>

        {/* Mobile/Tablet Simple Strip */}
        <div className="md:hidden border-t border-slate-100 bg-[#F8FAF7] px-4 py-2 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-2 text-xs font-bold min-w-max">
            <button
              type="button"
              onClick={() => onNavigate?.("dashboard")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "dashboard" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("history")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "history" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("conditions")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "conditions" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Conditions
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("medications")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "medications" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Medications
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("investigations")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "investigations" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Tests
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("documents")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "documents" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("access")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "access" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Emergency Access
            </button>
          </nav>
        </div>
      </header>

      {/* Backdrop Dimmer on Mega-Menu Open (Smooth Coder.com-style blur) */}
      {openDropdown && (
        <div
          className="fixed inset-0 top-[60px] bg-slate-900/10 backdrop-blur-xs z-30 pointer-events-none transition-opacity duration-200"
          aria-hidden="true"
        />
      )}
    </>
  );
}
