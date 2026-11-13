import { useEffect, useRef, useState } from "react";
import {
  History,
  Pill,
  Activity,
  FolderOpen,
  ArrowRight,
  Upload,
  FilePlus2,
  FileText,
  X,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  ClipboardList,
  Camera,
} from "lucide-react";
import { api } from "../../services/api";
import { CameraScannerModal } from "../../components/modals/CameraScannerModal";

interface Props {
  patientId?: number;
  onUploadSuccess?: () => void;
  onNavigate: (page: string) => void;
}

const sections = [
  {
    title: "Medical History",
    description: "Explore your complete verifiable chronological journey.",
    icon: History,
    page: "history",
  },
  {
    title: "Conditions & Diagnoses",
    description: "View conditions and diagnoses documented in your records.",
    icon: ClipboardList,
    page: "conditions",
  },
  {
    title: "Medications",
    description: "Explore active, changed, and discontinued medications.",
    icon: Pill,
    page: "medications",
  },
  {
    title: "Tests & Investigations",
    description: "Track lab results, blood glucose, and vitals over time.",
    icon: Activity,
    page: "investigations",
  },
  {
    title: "Medical Documents",
    description: "Access and view all uploaded clinical records and PDFs.",
    icon: FolderOpen,
    page: "documents",
  },
];

export default function PatientDashboard({ patientId = 101, onUploadSuccess, onNavigate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const [docCount, setDocCount] = useState<number>(10);
  const [eventCount, setEventCount] = useState<number>(14);
  const [medCount, setMedCount] = useState<number>(3);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const PATIENT_BANNER_DATA: Record<number, { name: string; age: number; badge: string; sub: string; desc: string; hospitalCount: number }> = {
    101: {
      name: "Rajesh Sharma",
      age: 72,
      badge: "Caregiver Mode Active",
      sub: "Primary Caregiver: Anoop Sharma (Son) • Managing Parent Dossier",
      desc: "Stitching 10+ years of complex illnesses (Type-2 Diabetes, Hypertension, Coronary Artery Disease) across 4 hospital facilities. No more carrying thick plastic bags of crumpled papers to consultations.",
      hospitalCount: 4,
    },
    102: {
      name: "Priya Patel",
      age: 32,
      badge: "Patient Portal Active",
      sub: "Emergency Contact: Rajesh Patel (Father)",
      desc: "Longitudinal Asthma & Allergy Profile. Reconciles 2022 health checkup with 2024 emergency Ceftriaxone allergy records across healthcare providers.",
      hospitalCount: 2,
    },
    103: {
      name: "Vikram Malhotra",
      age: 55,
      badge: "Patient Portal Active",
      sub: "Emergency Contact: Sunita Malhotra (Spouse)",
      desc: "Cardio-Metabolic Management & Statin Titration across City Heart Center and Apollo Specialty Clinic.",
      hospitalCount: 3,
    },
    104: {
      name: "Mohammed Irfan",
      age: 64,
      badge: "Patient Portal Active",
      sub: "Emergency Contact: Tariq Irfan (Son)",
      desc: "Renal Panel Tracking & Blood Glucose Monitoring across 4 independent healthcare networks.",
      hospitalCount: 4,
    },
    105: {
      name: "David Fernandes",
      age: 29,
      badge: "Patient Portal Active",
      sub: "Emergency Contact: Maria Fernandes (Spouse)",
      desc: "Baseline Wellness & Routine Health Examinations with verified document citations.",
      hospitalCount: 1,
    },
  };

  const banner = PATIENT_BANNER_DATA[patientId] || PATIENT_BANNER_DATA[101];

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getPatientDocuments(patientId).catch(() => []),
      api.getTimeline(patientId).catch(() => []),
    ]).then(([docs, events]) => {
      if (!active) return;
      if (docs && docs.length > 0) setDocCount(docs.length);
      if (events && events.length > 0) {
        setEventCount(events.length);
        const activeMeds = events.filter((e) => e.category === "MEDICATION" && e.status !== "DISCONTINUED");
        setMedCount(activeMeds.length);
      }
    });
    return () => {
      active = false;
    };
  }, [patientId]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setUploadStatus(null);
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadStatus(null);
    try {
      let count = 0;
      for (const file of selectedFiles) {
        await api.uploadDocument(patientId, file);
        count++;
      }
      setUploadStatus({
        type: "success",
        message: `Successfully ingested and parsed ${count} document${count > 1 ? "s" : ""} for Patient ${patientId}. Chronological timeline updated!`,
      });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadSuccess?.();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err && (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        ? (err as { response?: { data?: { detail?: string } } }).response!.data!.detail!
        : "Failed to upload document. Maximum allowed size is 15MB (.pdf, .png, .jpg).";
      setUploadStatus({
        type: "error",
        message: msg,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Unified Patient Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-white sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {banner.badge}
              </span>
              <span className="text-xs font-semibold text-emerald-200">
                {banner.sub}
              </span>
            </div>

            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {banner.name} (Age {banner.age})
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-white/80">
                {banner.desc}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 text-xs text-white/90">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>{banner.hospitalCount} Hospital Files Unified</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Active vs Discontinued Meds Clarified</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Emergency QR Pass Ready</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <History size={16} />
              <span>Medical History</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition shadow-xs"
            >
              <Camera size={16} />
              <span>Scan with Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-forest transition hover:bg-sage shadow-xs"
            >
              <FilePlus2 size={16} />
              <span>Upload Document</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("access")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <span>Emergency Access</span>
            </button>
          </div>
        </div>
      </section>

      {/* Clinical Telemetry Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sage bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">Ingested Documents</p>
            <div className="rounded-xl bg-sage/60 p-2 text-forest">
              <FolderOpen size={18} />
            </div>
          </div>
          <p className="mt-3 font-heading text-2xl font-extrabold text-forest">{docCount} Files</p>
        </div>

        <div className="rounded-2xl border border-sage bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">Timeline Events Extracted</p>
            <div className="rounded-xl bg-sage/60 p-2 text-forest">
              <Activity size={18} />
            </div>
          </div>
          <p className="mt-3 font-heading text-2xl font-extrabold text-forest">{eventCount} Recorded</p>
        </div>

        <div className="rounded-2xl border border-sage bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">Active Medications</p>
            <div className="rounded-xl bg-sage/60 p-2 text-forest">
              <Pill size={18} />
            </div>
          </div>
          <p className="mt-3 font-heading text-2xl font-extrabold text-forest">{medCount} Active</p>
        </div>
      </div>

      {/* Upload Medical Documents Section */}
      <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-sage/60 p-3 text-forest">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-forest">
                Ingest Medical Documents
              </h2>
              <p className="mt-1 max-w-lg text-sm text-muted">
                Upload prescriptions, lab reports (mmol/L or mg/dL), or discharge summaries. Processed with PyMuPDF and Gemini Vision OCR.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white transition hover:bg-forest/90"
          >
            <FilePlus2 size={18} />
            Select Files
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={handleFileSelection}
        />

        <div className="mt-6 rounded-2xl border-2 border-dashed border-sage bg-cream/50 p-6 text-center hover:bg-cream transition">
          <FolderOpen size={32} className="mx-auto text-forest/70" />
          <p className="mt-3 text-sm font-bold text-forest">
            Drop medical records here or browse from device
          </p>
          <p className="mt-1 text-xs text-muted">
            Supports PDF, JPG, PNG up to 15MB with bounding-box extraction
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-forest underline underline-offset-4 hover:opacity-80"
            >
              Browse files
            </button>
            <span className="text-xs text-muted">&bull;</span>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
            >
              <Camera size={14} />
              Live Camera Scan
            </button>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
                Selected Documents ({selectedFiles.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl bg-cream p-3 border border-sage/60"
                >
                  <FileText size={18} className="text-forest shrink-0" />
                  <span className="flex-1 truncate text-xs font-semibold text-slate-800">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-muted">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-muted hover:text-rose-600 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleUploadFiles}
                disabled={uploading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-forest py-3.5 text-sm font-bold text-white shadow transition hover:bg-forest/90 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    <span>Extracting Entities with PyMuPDF & OCR...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Upload & Process {selectedFiles.length} Document{selectedFiles.length > 1 ? "s" : ""}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className={`mt-4 rounded-xl p-4 flex items-start gap-3 text-sm font-medium ${
            uploadStatus.type === "success" 
              ? "bg-emerald-50 text-emerald-950 border border-emerald-200" 
              : "bg-red-50 text-red-900 border border-red-200"
          }`}>
            {uploadStatus.type === "success" ? (
              <CheckCircle2 size={19} className="shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle size={19} className="shrink-0 mt-0.5 text-red-600" />
            )}
            <div>
              <p className="font-bold text-xs uppercase tracking-wide">
                {uploadStatus.type === "success" ? "Ingestion Succeeded" : "Ingestion Error"}
              </p>
              <p className="mt-0.5 text-xs">{uploadStatus.message}</p>
            </div>
          </div>
        )}
      </section>

      {/* Health Records Navigation Cards */}
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-xl font-bold text-forest">
            Health Record Modules
          </h2>
          <p className="mt-1 text-sm text-muted">
            Access discrete categories of your longitudinal timeline.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.page}
                type="button"
                onClick={() => onNavigate(section.page)}
                className="group rounded-2xl border border-sage bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-forest hover:shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-sage/50 p-2.5 text-forest group-hover:bg-forest group-hover:text-white transition">
                    <Icon size={20} />
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-muted transition group-hover:text-forest group-hover:translate-x-1"
                  />
                </div>

                <h3 className="font-heading font-bold text-forest text-base">
                  {section.title}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-muted">
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        patientId={patientId}
        onClose={() => setIsCameraScannerOpen(false)}
        onSuccess={() => {
          onUploadSuccess?.();
          setUploadStatus({
            type: "success",
            message: "Prescription scan successfully ingested and extracted to chronological timeline!",
          });
        }}
      />
    </div>
  );
}
