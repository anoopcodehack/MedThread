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
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";
import { getSupabaseClient } from "../../lib/supabase";
import type { PatientPage } from "./PatientSidebar";

interface Props {
  title?: string;
  patientName?: string;
  patientExternalId?: string;
  patientId?: number;
  activePage?: PatientPage;
  onNavigate?: (page: PatientPage) => void;
}

export interface PatientNotification {
  id: string;
  patientId?: number;
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

// 5 Dedicated Benchmark Patient Seed Notifications - strictly isolated per patient!
const DEFAULT_PATIENT_NOTIFICATIONS: Record<number, PatientNotification[]> = {
  // Patient 101: Rajesh Sharma (Cardiology - Aspirin Prophylaxis Resumed)
  101: [
    {
      id: "notif-seed-101",
      patientId: 101,
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
  ],
  // Patient 102: Priya Patel (Allergy - Ceftriaxone Anaphylaxis Confirmed)
  102: [
    {
      id: "notif-seed-102",
      patientId: 102,
      type: "CLINICAL_OVERRIDE",
      title: "Allergy Alert Status Confirmed",
      doctor: "Dr. Ananya Rao",
      facility: "Apollo Heart Institute",
      entity: "Ceftriaxone",
      field: "Allergy Confirmation",
      beforeValue: "UNVERIFIED",
      afterValue: "CONFIRMED ANAPHYLAXIS",
      reason: "Cross-checked emergency admissions report; acute urticaria on cephalosporin.",
      timestamp: "35 mins ago",
      read: false,
      eventId: 42,
    },
  ],
  // Patient 103: Vikram Malhotra (Lipidology - Atorvastatin Titration)
  103: [
    {
      id: "notif-seed-103",
      patientId: 103,
      type: "CLINICAL_OVERRIDE",
      title: "Statin Dosage Titration Verified",
      doctor: "Dr. Ananya Rao",
      facility: "Apollo Heart Institute",
      entity: "Atorvastatin",
      field: "Dosage",
      beforeValue: "10 MG",
      afterValue: "20 MG",
      reason: "Up-titrated per ACC/AHA guidelines for LDL target control.",
      timestamp: "1 hour ago",
      read: false,
      eventId: 45,
    },
  ],
  // Patient 104: Mohammed Irfan (Endocrinology - Metformin Regimen)
  104: [
    {
      id: "notif-seed-104",
      patientId: 104,
      type: "CLINICAL_OVERRIDE",
      title: "Glycemic Titration Schedule Confirmed",
      doctor: "Dr. Ananya Rao",
      facility: "Apollo Heart Institute",
      entity: "Metformin",
      field: "Frequency",
      beforeValue: "500 MG ONCE DAILY",
      afterValue: "500 MG TWICE DAILY",
      reason: "Post-prandial glycemic stabilization per clinical protocol.",
      timestamp: "2 hours ago",
      read: false,
      eventId: 48,
    },
  ],
  // Patient 105: David Fernandes (Nephrology - Lisinopril Dosage)
  105: [
    {
      id: "notif-seed-105",
      patientId: 105,
      type: "CLINICAL_OVERRIDE",
      title: "Renal Protective Dosing Confirmed",
      doctor: "Dr. Ananya Rao",
      facility: "Apollo Heart Institute",
      entity: "Lisinopril",
      field: "Dosage",
      beforeValue: "20 MG",
      afterValue: "10 MG",
      reason: "Serum creatinine stable; maintenance renal protection dose confirmed.",
      timestamp: "3 hours ago",
      read: false,
      eventId: 51,
    },
  ],
};

function formatCleanValue(val: string | undefined): string {
  if (!val) return "N/A";
  const s = String(val).trim();
  if (s.includes("TEMPORARILY_HELD") || s.includes("TEMPORARILY HELD")) return "TEMPORARILY HELD";
  if (
    s.toLowerCase().includes("contradictory") ||
    s.toLowerCase().includes("marked as") ||
    s.includes("without surgical")
  ) {
    return "CONTRADICTION DETECTED";
  }
  if (s === "STARTED") return "ACTIVE";
  if (s.length > 25) return s.slice(0, 22) + "...";
  return s;
}

export default function PatientHeader({
  activePage = "dashboard",
  patientId = 101,
  onNavigate,
}: Props) {
  const [openDropdown, setOpenDropdown] = useState<"records" | "documents" | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [liveToast, setLiveToast] = useState<PatientNotification | null>(null);

  // Strictly retrieve notifications scoped ONLY to this specific patient ID!
  const getScopedNotifications = (pid: number): PatientNotification[] => {
    try {
      const patientKey = `medthread_patient_notifications_${pid}`;
      const patientStored = localStorage.getItem(patientKey);
      if (patientStored) {
        const parsed = JSON.parse(patientStored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strictly keep only this patient's notifications!
          const own = parsed.filter((n: PatientNotification) => {
            if (!n || typeof n !== "object") return false;
            // Strict ID match: must match pid
            if (n.patientId && Number(n.patientId) !== Number(pid)) return false;
            // Cleanse cross-contamination from earlier sessions:
            // Non-101 patients should never inherit Patient 101's Aspirin conflict override
            if (pid !== 101 && n.entity?.toLowerCase().includes("aspirin")) return false;
            return true;
          });
          if (own.length > 0) return own;
        }
      }
    } catch {}
    // If no overrides yet for this specific patient, return their clean isolated default notification
    return DEFAULT_PATIENT_NOTIFICATIONS[pid] || [];
  };

  const [notifications, setNotifications] = useState<PatientNotification[]>(() =>
    getScopedNotifications(patientId)
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  // When switching between patients (e.g. from Patient A to Patient B), strictly isolate notifications
  useEffect(() => {
    setNotifications(getScopedNotifications(patientId));
  }, [patientId]);

  // Trigger floating alert toast for 6 seconds
  const triggerToast = (notif: PatientNotification) => {
    setLiveToast(notif);
    setTimeout(() => {
      setLiveToast((current) => (current?.id === notif.id ? null : current));
    }, 6500);
  };

  // Sync notifications: Same-window, cross-tab BroadcastChannel, storage events, and Supabase polling
  useEffect(() => {
    // 1. Same-window custom event (Strict Patient Isolation)
    const handleNewNotif = (e: any) => {
      const notif = e.detail;
      // STRICT PATIENT ISOLATION: A patient notification must NEVER show in B patient dashboard!
      if (notif && Number(notif.patientId) === Number(patientId)) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          const next = [notif, ...prev];
          try {
            localStorage.setItem(`medthread_patient_notifications_${patientId}`, JSON.stringify(next));
          } catch {}
          return next;
        });
        triggerToast(notif);
      }
    };
    window.addEventListener("medthread_notification_added", handleNewNotif);

    // 2. Cross-tab BroadcastChannel for 0-latency inter-tab messaging (Strict Patient Isolation)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("medthread_live_notifications");
      bc.onmessage = (event) => {
        const notif = event.data;
        // STRICT PATIENT ISOLATION: Ignore if notification belongs to a different patient
        if (notif && Number(notif.patientId) === Number(patientId)) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notif.id)) return prev;
            const next = [notif, ...prev];
            try {
              localStorage.setItem(`medthread_patient_notifications_${patientId}`, JSON.stringify(next));
            } catch {}
            return next;
          });
          triggerToast(notif);
        }
      };
    } catch {}

    // 3. Cross-tab localStorage storage event (Strictly scoped to patientId)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `medthread_patient_notifications_${patientId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const own = parsed.filter((n: PatientNotification) => Number(n.patientId) === Number(patientId));
            setNotifications(own);
            if (own.length > 0 && !own[0].read) {
              triggerToast(own[0]);
            }
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Supabase DB real-time poll for cross-device updates (Strictly patientId scoped)
    const pollSupabase = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("timeline_events")
          .select("id, patient_id, entity, category, status, normalized_value, reviewed_override, is_reviewed")
          .eq("patient_id", patientId)
          .eq("is_reviewed", 1)
          .order("id", { ascending: false })
          .limit(5);

        if (!error && data && data.length > 0) {
          setNotifications((prev) => {
            let changed = false;
            const next = [...prev];
            for (const row of data) {
              const rowId = `supabase-event-${row.id}`;
              if (!next.some((n) => n.id === rowId)) {
                changed = true;
                let docName = "Dr. Ananya Rao";
                let reason = "Verified with patient and clinical consultation note";
                let overrideVal = row.normalized_value || row.status || "VERIFIED";
                if (row.reviewed_override) {
                  const docMatch = row.reviewed_override.match(/\[CLINICIAN OVERRIDE by (.*?)\]/);
                  if (docMatch) docName = docMatch[1];
                  const reasonMatch = row.reviewed_override.match(/Reason: (.*)$/);
                  if (reasonMatch) reason = reasonMatch[1];
                  const setMatch = row.reviewed_override.match(/set to '(.*?)'/);
                  if (setMatch) overrideVal = setMatch[1];
                }

                const newNotif: PatientNotification = {
                  id: rowId,
                  patientId: patientId,
                  type: "CLINICAL_OVERRIDE",
                  title: "Doctor Record Update Verified",
                  doctor: docName,
                  facility: "Apollo Heart Institute",
                  entity: row.entity || "Medication Record",
                  field: row.category === "MEDICATION" ? "Medication Status" : "Clinical Value",
                  beforeValue: "TEMPORARILY HELD",
                  afterValue: overrideVal.toUpperCase(),
                  reason: reason,
                  timestamp: "Just now",
                  read: false,
                  eventId: row.id,
                };
                next.unshift(newNotif);
              }
            }
            if (changed) {
              try {
                localStorage.setItem(`medthread_patient_notifications_${patientId}`, JSON.stringify(next));
              } catch {}
              return next;
            }
            return prev;
          });
        }
      } catch {}
    };

    pollSupabase();
    const interval = setInterval(pollSupabase, 3000);

    // Close notifications popover on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("medthread_notification_added", handleNewNotif);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [patientId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem(`medthread_patient_notifications_${patientId}`, JSON.stringify(updated));
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

  const isDocsActive = ["documents", "scanner"].includes(activePage);

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
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#7B9E91] via-[#8AAFA2] to-[#7B9E91] text-white backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl w-full mx-auto px-6 py-3.5 flex items-center justify-between gap-6 relative">
          {/* Left: Brand Logo (Light theme on mist green) */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group" title="Return to MedThread Home">
              <BrandLogo theme="light" size="md" showSubtitle />
            </Link>
          </div>

          {/* Center: Mega-Menu Top Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-white/90">
            {/* 1. Overview Direct Link */}
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                onNavigate?.("dashboard");
              }}
              className={`transition flex flex-col items-center py-1 font-bold ${
                activePage === "dashboard"
                  ? "text-white"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <span>Overview</span>
              {activeDot === "dashboard" && (
                <span className="w-1.5 h-1.5 bg-white rounded-xs mt-1 block shadow-xs" />
              )}
            </button>

            {/* 2. Clinical Records Mega-Menu Hover Dropdown */}
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
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>Clinical Records</span>
                {activeDot === "records" && (
                  <span className="w-1.5 h-1.5 bg-white rounded-xs mt-1 block shadow-xs" />
                )}
              </button>

              {/* Mega-Menu Flyout: Clean 5 category links only (other fluff removed) */}
              {openDropdown === "records" && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-left"
                  onMouseEnter={() => handleMouseEnter("records")}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate?.("history");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition shrink-0">
                      <History size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Medical History
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate?.("conditions");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition shrink-0">
                      <ClipboardList size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Conditions &amp; Diagnoses
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate?.("medications");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition shrink-0">
                      <Pill size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Medications &amp; Doses
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate?.("investigations");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition shrink-0">
                      <Activity size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Tests &amp; Lab Panels
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate?.("visits");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition shrink-0">
                      <Hospital size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Visits &amp; Procedures
                      </span>
                    </div>
                  </button>
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
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>Documents</span>
                {activeDot === "documents" && (
                  <span className="w-1.5 h-1.5 bg-white rounded-xs mt-1 block shadow-xs" />
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
                      onNavigate?.("scanner");
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <Camera size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Prescription Scanner
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Decipher handwritten doctor prescriptions
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
                  ? "text-white"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <span>Emergency Access</span>
              {activeDot === "access" && (
                <span className="w-1.5 h-1.5 bg-white rounded-xs mt-1 block shadow-xs" />
              )}
            </button>
          </nav>

          {/* Right: Notifications, Profile Icon Only, & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications with Real-Time Clinician Update Badge & Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl transition ${
                  isNotifOpen
                    ? "bg-white/25 text-white"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                }`}
                aria-label="Clinician updates and audit alerts"
                title="Clinician updates and prescription audits"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[390px] rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-forest/10 text-forest">
                        <ShieldCheck size={15} />
                      </div>
                      <h4 className="font-heading font-bold text-xs text-slate-900">
                        Doctor Record Updates
                      </h4>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-forest hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
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
                            !notif.read ? "bg-emerald-50/25" : ""
                          }`}
                        >
                          {/* Doctor & Facility */}
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Stethoscope size={13} className="text-forest" />
                              {notif.doctor}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={11} />
                              {notif.timestamp}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 mb-2 font-medium">
                            {notif.facility} · Overrode <strong className="text-slate-800">{notif.entity}</strong>
                          </p>

                          {/* Visual Before vs Current Diff Box */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Verified Update ({notif.field}):
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 line-through text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded text-[11px] font-semibold">
                                <span className="text-[9px] uppercase font-bold text-rose-500">Old:</span>
                                {formatCleanValue(notif.beforeValue)}
                              </span>
                              <ArrowRight size={12} className="text-slate-400 shrink-0" />
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[11px]">
                                <span className="text-[9px] uppercase font-bold text-emerald-700">New:</span>
                                {formatCleanValue(notif.afterValue)}
                              </span>
                            </div>
                          </div>

                          {/* Justification note */}
                          {notif.reason && (
                            <p className="text-[11px] text-slate-600 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100 mb-2 leading-relaxed">
                              &ldquo;{notif.reason}&rdquo;
                            </p>
                          )}

                          {/* Action button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotifOpen(false);
                              onNavigate?.("medications");
                            }}
                            className="text-xs font-bold text-forest hover:text-emerald-800 flex items-center gap-1 group cursor-pointer"
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
                  ? "bg-white text-[#0A2A18] border-white ring-2 ring-white/40"
                  : "bg-white/15 hover:bg-white/25 border-white/30 text-white"
              }`}
              title="Open Profile & Caregivers"
              aria-label="Open Profile & Caregivers"
            >
              <UserRound size={17} />
            </button>

            {/* Logout Button (Dark Green Pill Style from Landing Page) */}
            <Link
              to="/"
              className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md transition-all transform hover:scale-105 uppercase tracking-wider flex items-center gap-1.5 border border-white/20"
              title="Logout from Patient Portal"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>

        {/* Mobile/Tablet Simple Strip */}
        <div className="md:hidden border-t border-white/15 bg-[#789B8E] px-4 py-2 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-2 text-xs font-bold min-w-max text-white">
            <button
              type="button"
              onClick={() => onNavigate?.("dashboard")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "dashboard" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("history")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "history" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("conditions")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "conditions" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
              }`}
            >
              Conditions
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("medications")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "medications" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
              }`}
            >
              Medications
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("investigations")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "investigations" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
              }`}
            >
              Tests
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("documents")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "documents" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
              }`}
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("access")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activePage === "access" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
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

      {/* Live Floating Toast Notification when Doctor Overrides / Verifies */}
      {liveToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm rounded-2xl bg-white p-4 shadow-2xl border-2 border-emerald-500 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <Bell size={16} className="animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Live Doctor Record Update
                </span>
                <h5 className="text-xs font-bold text-slate-900 mt-0.5">
                  {liveToast.doctor}
                </h5>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Updated <strong>{liveToast.entity}</strong>:{" "}
                  <span className="line-through text-rose-600">{formatCleanValue(liveToast.beforeValue)}</span>
                  {" ➔ "}
                  <span className="text-emerald-700 font-bold">{formatCleanValue(liveToast.afterValue)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLiveToast(null);
                    setIsNotifOpen(true);
                  }}
                  className="mt-1.5 text-[11px] font-bold text-forest hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
