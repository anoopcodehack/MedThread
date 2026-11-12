
import { useRef, useState } from "react";
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
} from "lucide-react";

interface Props {
  onNavigate: (page: string) => void;
}

const sections = [
  {
    title: "Medical History",
    description: "Explore your complete medical journey.",
    icon: History,
    page: "history",
  },
  {
    title: "Conditions & Diagnoses",
    description: "View conditions documented in your records.",
    icon: FileText,
    page: "conditions",
  },
  {
    title: "Medications",
    description: "Explore current and previous medications.",
    icon: Pill,
    page: "medications",
  },
  {
    title: "Tests & Investigations",
    description: "Access laboratory and investigation records.",
    icon: Activity,
    page: "investigations",
  },
];

export default function PatientDashboard({ onNavigate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  return (
    <div className="space-y-8">

      {/* Welcome section */}
      <section className="rounded-2xl bg-gradient-to-r from-[#164A32] to-[#6C987F] p-7 text-white md:p-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-[#D9E9DC]">
          Your health, connected
        </p>

        <h1 className="max-w-2xl text-2xl font-bold leading-tight md:text-3xl">
          Your complete medical history, all in one place.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
          Organize your medical records, access your health information
          and keep your healthcare journey connected.
        </p>
      </section>

      {/* Upload medical documents */}
      <section className="rounded-2xl border border-[#DCE8DE] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
              <Upload size={25} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#26352D]">
                Upload Medical Documents
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-6 text-[#829087]">
                Add prescriptions, laboratory reports, discharge
                summaries, scan reports and other medical documents.
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#164A32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#082818]"
          >
            <FilePlus2 size={18} />
            Upload Documents
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

        <div className="mt-6 rounded-xl border-2 border-dashed border-[#C7D9CB] bg-[#F8FAF8] p-6 text-center">
          <FolderOpen
            size={30}
            className="mx-auto text-[#6C987F]"
          />

          <p className="mt-3 text-sm font-medium text-[#26352D]">
            Select your medical records to get started
          </p>

          <p className="mt-1 text-xs text-[#829087]">
            PDF, JPG and PNG files
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 text-sm font-semibold text-[#164A32] underline underline-offset-4"
          >
            Browse files
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#26352D]">
                Selected files
              </h3>

              <button
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-xs text-red-600"
              >
                Clear all
              </button>
            </div>

            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg bg-[#F1F6F1] p-3"
              >
                <FileText size={19} className="text-[#52705D]" />
                <span className="flex-1 truncate text-sm text-[#26352D]">
                  {file.name}
                </span>
                <button
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setSelectedFiles((previous) =>
                      previous.filter((_, i) => i !== index)
                    )
                  }
                  className="text-[#829087] hover:text-red-600"
                >
                  <X size={17} />
                </button>
              </div>
            ))}

            <p className="text-xs text-[#829087]">
              Files are selected locally. They have not been uploaded yet.
              Backend upload integration is pending.
            </p>
          </div>
        )}
      </section>

      {/* Medical sections */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#26352D]">
            Your Health Records
          </h2>

          <p className="mt-1 text-sm text-[#829087]">
            Access different sections of your medical history.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.page}
                onClick={() => onNavigate(section.page)}
                className="group rounded-2xl border border-[#E5ECE6] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#B5CCB8] hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
                    <Icon size={22} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-[#91A397] transition group-hover:translate-x-1"
                  />
                </div>

                <h3 className="font-semibold text-[#26352D]">
                  {section.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#829087]">
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}