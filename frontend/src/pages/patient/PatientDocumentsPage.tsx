import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  FileText,
  FilterX,
  FolderOpen,
  LoaderCircle,
  RotateCcw,
  Search,
} from "lucide-react";
import { api } from "../../services/api";
import type {
  PatientDocument,
  SignedDocumentUrl,
  TimelineEventItem,
} from "../../types/clinical";

type LoadState = "unavailable" | "loading" | "ready" | "error";
type OcrFilter = "all" | "applied" | "not-applied";

interface Props {
  patientId?: number;
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function errorText(reason: unknown): string {
  return reason instanceof Error ? reason.message : "The request failed.";
}

export default function PatientDocumentsPage({ patientId }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [timelineError, setTimelineError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("all");
  const [ocrFilter, setOcrFilter] = useState<OcrFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [linkStates, setLinkStates] = useState<
    Record<number, "loading" | "error">
  >({});
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({});
  const [signedLinks, setSignedLinks] = useState<
    Record<number, SignedDocumentUrl>
  >({});

  const hasPatientId =
    typeof patientId === "number" &&
    Number.isSafeInteger(patientId) &&
    patientId > 0;

  useEffect(() => {
    if (!hasPatientId) {
      setLoadState("unavailable");
      setDocuments([]);
      setEvents([]);
      return;
    }

    let active = true;
    setLoadState("loading");
    setLoadError("");
    setTimelineError("");

    api
      .getPatientDocuments(patientId)
      .then((documentItems) => {
        if (!active) return;
        setDocuments(documentItems);
        setLoadState("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLoadError(errorText(reason));
        setLoadState("error");
      });

    api
      .getTimeline(patientId)
      .then((timelineItems) => {
        if (active) setEvents(timelineItems);
      })
      .catch((reason: unknown) => {
        if (active) setTimelineError(errorText(reason));
      });

    return () => {
      active = false;
    };
  }, [hasPatientId, patientId, retryCount]);

  const fileTypes = useMemo(
    () => [...new Set(documents.map((document) => document.file_type))].sort(),
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return documents
      .filter((document) => {
        if (fileType !== "all" && document.file_type !== fileType) return false;
        if (ocrFilter === "applied" && !document.ocr_applied) return false;
        if (ocrFilter === "not-applied" && document.ocr_applied) return false;

        const relatedEvents = events.filter(
          (event) => event.source_doc === document.filename,
        );
        if (
          query &&
          ![
            document.filename,
            document.file_type,
            document.uploaded_at,
            ...relatedEvents.flatMap((event) => [
              event.entity,
              event.category,
              event.source_passage,
            ]),
          ].some((value) => value?.toLocaleLowerCase().includes(query))
        ) {
          return false;
        }

        const uploadedDate = document.uploaded_at.slice(0, 10);
        if (startDate || endDate) {
          if (!isValidIsoDate(uploadedDate)) return false;
          if (startDate && uploadedDate < startDate) return false;
          if (endDate && uploadedDate > endDate) return false;
        }

        return true;
      })
      .sort((left, right) => {
        const order = left.uploaded_at.localeCompare(right.uploaded_at);
        return sortOrder === "newest" ? -order : order;
      });
  }, [
    documents,
    endDate,
    events,
    fileType,
    ocrFilter,
    search,
    sortOrder,
    startDate,
  ]);

  const hasActiveFilters =
    search !== "" ||
    fileType !== "all" ||
    ocrFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

  function clearFilters() {
    setSearch("");
    setFileType("all");
    setOcrFilter("all");
    setStartDate("");
    setEndDate("");
  }

  async function prepareDocumentLink(document: PatientDocument) {
    if (patientId === undefined) return;

    setLinkStates((current) => ({
      ...current,
      [document.id]: "loading",
    }));
    setLinkErrors((current) => ({
      ...current,
      [document.id]: "",
    }));

    try {
      const signedLink = await api.getSignedDocumentUrl(
        patientId,
        document.filename,
      );
      const url = new URL(signedLink.signed_url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("The document service returned an unsupported URL.");
      }

      setSignedLinks((current) => ({
        ...current,
        [document.id]: signedLink,
      }));
      setLinkStates((current) => {
        const next = { ...current };
        delete next[document.id];
        return next;
      });
    } catch (reason) {
      setLinkStates((current) => ({
        ...current,
        [document.id]: "error",
      }));
      setLinkErrors((current) => ({
        ...current,
        [document.id]: errorText(reason),
      }));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#E5ECE6] bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
            <FolderOpen size={23} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#26352D]">
              Medical Documents
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#718077]">
              Browse uploaded records and prepare time-limited document links
              through the backend.
            </p>
          </div>
        </div>

        {loadState === "unavailable" ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
          >
            <h2 className="font-semibold">Patient account is not connected</h2>
            <p className="mt-1 text-sm leading-6">
              Select a backend patient above to load that patient’s document
              list. No documents have been requested or displayed.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-5 rounded-xl border border-[#DCE8DE] bg-[#F7F9F7] p-4 text-sm leading-6 text-[#526158]">
              <strong>Two-Tier Ingestion Bridge:</strong> Native digital PDFs and electronic reports are parsed directly via PyMuPDF in &lt;55ms (<span className="text-emerald-700 font-semibold">⚡ Direct Text</span>). Scanned camera photos or image-only documents automatically trigger multimodal Gemini 2.0 Flash Vision OCR (<span className="text-purple-700 font-semibold">📷 Vision OCR Applied</span>).
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Search documents
                </span>
                <span className="flex items-center gap-2 rounded-lg border border-[#DCE8DE] px-3 focus-within:border-[#6C987F] focus-within:ring-2 focus-within:ring-[#6C987F]/20">
                  <Search
                    size={17}
                    className="shrink-0 text-[#829087]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Name, type or related event"
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-[#26352D] outline-none placeholder:text-[#9AA69E]"
                  />
                </span>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Document type
                </span>
                <select
                  value={fileType}
                  onChange={(event) => setFileType(event.target.value)}
                  className="w-full rounded-lg border border-[#DCE8DE] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
                >
                  <option value="all">All types</option>
                  {fileTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  OCR status
                </span>
                <select
                  value={ocrFilter}
                  onChange={(event) =>
                    setOcrFilter(event.target.value as OcrFilter)
                  }
                  className="w-full rounded-lg border border-[#DCE8DE] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
                >
                  <option value="all">All Ingestion Streams</option>
                  <option value="applied">Vision OCR Applied (Scanned)</option>
                  <option value="not-applied">Direct Digital Stream (&lt;55ms)</option>
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Uploaded from
                </span>
                <input
                  aria-label="Uploaded from"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-lg border border-[#DCE8DE] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Uploaded to
                </span>
                <input
                  aria-label="Uploaded to"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-lg border border-[#DCE8DE] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Sort by
                </span>
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "newest" | "oldest")
                  }
                  className="w-full rounded-lg border border-[#DCE8DE] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2EE] pt-4">
              <p aria-live="polite" className="text-sm text-[#718077]">
                {loadState === "ready"
                  ? `${filteredDocuments.length} document(s)`
                  : loadState === "error"
                    ? "Documents unavailable"
                    : "Loading documents"}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#164A32] hover:bg-[#EAF1EB] focus:outline-none focus:ring-2 focus:ring-[#6C987F]"
                >
                  <FilterX size={16} aria-hidden="true" />
                  Clear filters
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {loadState === "loading" && (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-[#E5ECE6] bg-white p-8 text-sm text-[#52705D]"
        >
          <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
          Loading document vault…
        </div>
      )}

      {loadState === "error" && (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-rose-700" size={21} />
            <div>
              <h2 className="font-semibold text-[#26352D]">
                Documents couldn’t be loaded
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#718077]">
                {loadError || "The document endpoint returned an error."} No
                local paths or sample records have been substituted.
              </p>
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#164A32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#082818] focus:outline-none focus:ring-2 focus:ring-[#6C987F] focus:ring-offset-2"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        </section>
      )}

      {loadState === "ready" && timelineError && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        >
          Related timeline events couldn’t be loaded: {timelineError}
        </p>
      )}

      {loadState === "ready" && filteredDocuments.length === 0 && (
        <EmptyState
          title={
            documents.length === 0
              ? "No uploaded documents returned"
              : "No documents match these filters"
          }
          description={
            documents.length === 0
              ? "The backend document endpoint returned no records for this patient."
              : "Try changing your search or filters to see uploaded documents."
          }
          action={
            documents.length > 0 && hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-[#B5CCB8] px-4 py-2 text-sm font-semibold text-[#164A32] hover:bg-[#EAF1EB] focus:outline-none focus:ring-2 focus:ring-[#6C987F]"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      )}

      {loadState === "ready" && filteredDocuments.length > 0 && (
        <section aria-label="Uploaded medical documents" className="space-y-4">
          {filteredDocuments.map((document) => {
            const relatedEvents = events.filter(
              (event) => event.source_doc === document.filename,
            );
            const signedLink = signedLinks[document.id];
            const linkState = linkStates[document.id];

            return (
              <article
                key={document.id}
                className="rounded-2xl border border-[#E5ECE6] bg-white p-5 shadow-sm md:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-[#EAF1EB] p-2.5 text-[#164A32]">
                      <FileText size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-[#26352D]">
                        {document.filename}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-[#EAF1EB] px-2.5 py-1 text-[#45634E]">
                          {document.file_type}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 font-medium ${
                          document.ocr_applied
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}>
                          {document.ocr_applied
                            ? "📷 Vision OCR Applied"
                            : "⚡ Direct Text (<55ms)"}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#829087]">
                        <CalendarDays size={14} aria-hidden="true" />
                        Uploaded: {document.uploaded_at}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => prepareDocumentLink(document)}
                    disabled={linkState === "loading"}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#164A32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#082818] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {linkState === "loading" ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ExternalLink size={16} aria-hidden="true" />
                    )}
                    {signedLink ? "Refresh secure link" : "Prepare secure preview"}
                  </button>
                </div>

                {linkState === "error" && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"
                  >
                    Secure document link unavailable: {linkErrors[document.id]}
                  </p>
                )}

                {signedLink && (
                  <div className="mt-4 rounded-xl border border-[#C7D9CB] bg-[#F1F6F1] p-4">
                    <a
                      href={signedLink.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#164A32] underline underline-offset-4"
                    >
                      Open authorized document
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                    <p className="mt-1 text-xs text-[#718077]">
                      The backend says this link expires in{" "}
                      {signedLink.expires_in_seconds} seconds.
                    </p>
                  </div>
                )}

                {relatedEvents.length > 0 && (
                  <div className="mt-5 border-t border-[#EEF2EE] pt-4">
                    <h3 className="text-xs font-semibold text-[#52705D]">
                      Related timeline events
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {relatedEvents.map((event, index) => (
                        <li
                          key={`${event.id ?? event.entity}-${index}`}
                          className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-[#526158]"
                        >
                          {event.raw_date && (
                            <span className="font-medium text-[#164A32]">
                              {event.raw_date}
                            </span>
                          )}
                          {event.category && <span>{event.category}</span>}
                          {event.entity && <span>{event.entity}</span>}
                          {typeof event.page_number === "number" && (
                            <span className="text-[#829087]">
                              Page {event.page_number}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-[#E5ECE6] bg-white px-6 py-10 text-center shadow-sm">
      <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
        <FolderOpen size={23} aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-semibold text-[#26352D]">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[#718077]">
        {description}
      </p>
      {action}
    </section>
  );
}
