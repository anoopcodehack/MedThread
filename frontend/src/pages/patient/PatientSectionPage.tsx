import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownWideNarrow,
  CalendarDays,
  ClipboardList,
  FileText,
  FilterX,
  HeartPulse,
  Hospital,
  LoaderCircle,
  Pill,
  QrCode,
  RotateCcw,
  Search,
  Share2,
  Stethoscope,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { api } from "../../services/api";
import type {
  ContradictionItem,
  TimelineEventItem,
} from "../../types/clinical";
import type { PatientPage } from "../../components/patient/PatientSidebar";

type PatientSection = Exclude<
  PatientPage,
  "dashboard" | "history" | "documents"
>;
type TimelineSection = Extract<
  PatientSection,
  "conditions" | "medications" | "investigations" | "visits"
>;
type LoadState = "unavailable" | "loading" | "ready" | "error";
type StatusFilter =
  | "all"
  | "reviewed"
  | "not-reviewed"
  | `event:${string}`
  | `conflict:${string}`;
type SectionIcon = ComponentType<LucideProps>;

interface SectionConfig {
  title: string;
  description: string;
  icon: SectionIcon;
  categories?: string[];
  dataNote?: string;
}

interface Props {
  page: PatientSection;
  patientId?: number;
}

const sectionConfig: Record<PatientSection, SectionConfig> = {
  conditions: {
    title: "Conditions & Diagnoses",
    description:
      "Documented condition and diagnosis events with their original notes and source references.",
    icon: ClipboardList,
    categories: ["CONDITION", "DIAGNOSIS"],
    dataNote:
      "The timeline supplies a date status and review status, but not a diagnosis-mention confidence field. Ambiguous dates are shown as supplied; diagnosis certainty is not inferred.",
  },
  medications: {
    title: "Medications",
    description:
      "Medication events in the record, including backend-provided change and treatment statuses.",
    icon: Pill,
    categories: ["MEDICATION"],
    dataNote:
      "Medication events are shown with their supplied status. The current schema has no frequency, route, prescribing provider, or effective start/end interval, so current-versus-historical use is not inferred.",
  },
  investigations: {
    title: "Tests & Investigations",
    description:
      "Laboratory and investigation events with original values, units, dates, and source references where supplied.",
    icon: Activity,
    categories: [
      "LAB",
      "LABORATORY",
      "TEST",
      "INVESTIGATION",
      "DIAGNOSTIC_INVESTIGATION",
    ],
    dataNote:
      "Original values and units are preserved. Reference ranges, laboratory/provider details, and document viewer URLs aren’t present in the timeline response.",
  },
  visits: {
    title: "Visits & Procedures",
    description:
      "Documented consultations, procedures, admissions, discharges, and other visit events returned by the timeline API.",
    icon: Hospital,
    categories: [
      "PROCEDURE",
      "SURGERY",
      "SURGICAL_PROCEDURE",
      "VISIT",
      "CONSULTATION",
      "ADMISSION",
      "HOSPITAL_ADMISSION",
      "DISCHARGE",
      "HOSPITAL_DISCHARGE",
      "HOSPITALIZATION",
      "EMERGENCY",
    ],
    dataNote:
      "The current event schema has no separate provider, facility, reason, or visit-type fields. This page displays only the category and text supplied in each timeline event.",
  },
  access: {
    title: "Share & Access",
    description:
      "Patient-controlled access sharing and caregiver permissions.",
    icon: Share2,
  },
  profile: {
    title: "Profile & Caregivers",
    description:
      "Patient profile information, emergency contacts, and caregiver access.",
    icon: HeartPulse,
  },
};

const timelineSections: TimelineSection[] = [
  "conditions",
  "medications",
  "investigations",
  "visits",
];

function isTimelineSection(page: PatientSection): page is TimelineSection {
  return timelineSections.includes(page as TimelineSection);
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function getConflictsForEvent(
  event: TimelineEventItem,
  conflicts: ContradictionItem[],
): ContradictionItem[] {
  return conflicts.filter(
    (conflict) =>
      conflict.category === event.category &&
      conflict.entity === event.entity &&
      (conflict.doc1_name === event.source_doc ||
        conflict.doc2_name === event.source_doc),
  );
}

function categoryMatches(page: TimelineSection, category: string): boolean {
  const supportedCategories = sectionConfig[page].categories ?? [];
  return supportedCategories.includes(category.toUpperCase());
}

function conflictBadgeClass(tier: string): string {
  if (tier === "DIRECT_CONFLICT") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (tier === "NEEDS_REVIEW") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-[#DCE8DE] bg-[#F1F6F1] text-[#45634E]";
}

export default function PatientSectionPage({ page, patientId }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [conflicts, setConflicts] = useState<ContradictionItem[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const config = sectionConfig[page];
  const SectionIcon = config.icon;
  const hasPatientId =
    typeof patientId === "number" &&
    Number.isSafeInteger(patientId) &&
    patientId > 0;
  const timelineBacked = isTimelineSection(page);
  const isFeatureUnavailable = page === "access" || page === "profile";

  useEffect(() => {
    if (!timelineBacked) return;

    if (!hasPatientId) {
      setLoadState("unavailable");
      setEvents([]);
      setConflicts([]);
      return;
    }

    let active = true;
    setLoadState("loading");

    Promise.all([api.getTimeline(patientId), api.getConflicts(patientId)])
      .then(([timelineItems, conflictItems]) => {
        if (!active) return;
        setEvents(timelineItems);
        setConflicts(conflictItems);
        setLoadState("ready");
      })
      .catch(() => {
        if (!active) return;
        setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [hasPatientId, page, patientId, retryCount, timelineBacked]);

  const sectionEvents = useMemo(
    () =>
      timelineBacked
        ? events.filter((event) => categoryMatches(page, event.category))
        : [],
    [events, page, timelineBacked],
  );

  const categories = useMemo(
    () => [...new Set(sectionEvents.map((event) => event.category))].sort(),
    [sectionEvents],
  );

  const eventStatuses = useMemo(
    () =>
      [...new Set(sectionEvents.map((event) => event.status).filter(Boolean))].sort(),
    [sectionEvents],
  );

  const conflictTiers = useMemo(
    () => [...new Set(conflicts.map((conflict) => conflict.tier))].sort(),
    [conflicts],
  );

  const filteredEvents = useMemo(
    () =>
      sectionEvents
        .filter((event) => {
          if (category !== "all" && event.category !== category) return false;

          const query = search.trim().toLocaleLowerCase();
          if (query) {
            const matches = [
              event.entity,
              event.category,
              event.status,
              event.raw_date,
              event.raw_value,
              event.raw_unit,
              event.normalized_value,
              event.source_doc,
              event.source_passage,
            ].some((value) => value?.toLocaleLowerCase().includes(query));
            if (!matches) return false;
          }

          if (startDate || endDate) {
            if (!isValidIsoDate(event.normalized_date)) return false;
            if (startDate && event.normalized_date < startDate) return false;
            if (endDate && event.normalized_date > endDate) return false;
          }

          if (statusFilter === "reviewed" && event.is_reviewed !== 1) {
            return false;
          }
          if (statusFilter === "not-reviewed" && event.is_reviewed !== 0) {
            return false;
          }
          if (statusFilter.startsWith("event:")) {
            if (event.status !== statusFilter.slice("event:".length)) {
              return false;
            }
          }
          if (statusFilter.startsWith("conflict:")) {
            const tier = statusFilter.slice("conflict:".length);
            if (
              !getConflictsForEvent(event, conflicts).some(
                (conflict) => conflict.tier === tier,
              )
            ) {
              return false;
            }
          }

          return true;
        })
        .map((event, index) => ({ event, index }))
        .sort((left, right) => {
          const leftDate = isValidIsoDate(left.event.normalized_date)
            ? left.event.normalized_date
            : null;
          const rightDate = isValidIsoDate(right.event.normalized_date)
            ? right.event.normalized_date
            : null;

          if (leftDate === null && rightDate !== null) return 1;
          if (leftDate !== null && rightDate === null) return -1;
          if (leftDate === null || rightDate === null) {
            return left.index - right.index;
          }

          const dateOrder = leftDate.localeCompare(rightDate);
          if (dateOrder === 0) return left.index - right.index;
          return sortOrder === "newest" ? -dateOrder : dateOrder;
        }),
    [
      category,
      conflicts,
      endDate,
      search,
      sectionEvents,
      sortOrder,
      startDate,
      statusFilter,
    ],
  );

  const hasActiveFilters =
    search !== "" ||
    startDate !== "" ||
    endDate !== "" ||
    category !== "all" ||
    statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setCategory("all");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#E5ECE6] bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
            <SectionIcon size={23} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#26352D]">
              {config.title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#718077]">
              {config.description}
            </p>
          </div>
        </div>

        {isFeatureUnavailable ? (
          <FeatureUnavailable page={page} />
        ) : loadState === "unavailable" ? (
          <UnavailablePatient />
        ) : (
          <>
            {config.dataNote && (
              <p className="mt-5 rounded-xl border border-[#DCE8DE] bg-[#F7F9F7] p-4 text-sm leading-6 text-[#526158]">
                {config.dataNote}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Search
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
                    placeholder={`Search ${config.title.toLowerCase()}`}
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-[#26352D] outline-none placeholder:text-[#9AA69E]"
                  />
                </span>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  From date
                </span>
                <span className="flex items-center gap-2 rounded-lg border border-[#DCE8DE] px-3 focus-within:border-[#6C987F] focus-within:ring-2 focus-within:ring-[#6C987F]/20">
                  <CalendarDays
                    size={16}
                    className="shrink-0 text-[#829087]"
                    aria-hidden="true"
                  />
                  <input
                    aria-label="From date"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#26352D] outline-none"
                  />
                </span>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  To date
                </span>
                <span className="flex items-center gap-2 rounded-lg border border-[#DCE8DE] px-3 focus-within:border-[#6C987F] focus-within:ring-2 focus-within:ring-[#6C987F]/20">
                  <CalendarDays
                    size={16}
                    className="shrink-0 text-[#829087]"
                    aria-hidden="true"
                  />
                  <input
                    aria-label="To date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#26352D] outline-none"
                  />
                </span>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-lg border border-[#DCE8DE] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
                >
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Review / event status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="w-full rounded-lg border border-[#DCE8DE] bg-white px-3 py-2.5 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
                >
                  <option value="all">All statuses</option>
                  <option value="reviewed">Clinician reviewed</option>
                  <option value="not-reviewed">Not reviewed</option>
                  {eventStatuses.map((status) => (
                    <option key={status} value={`event:${status}`}>
                      {status}
                    </option>
                  ))}
                  {conflictTiers.map((tier) => (
                    <option key={tier} value={`conflict:${tier}`}>
                      {tier}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
                  Timeline order
                </span>
                <span className="flex items-center gap-2 rounded-lg border border-[#DCE8DE] px-3">
                  <ArrowDownWideNarrow
                    size={16}
                    className="shrink-0 text-[#829087]"
                    aria-hidden="true"
                  />
                  <select
                    aria-label="Timeline order"
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(event.target.value as "newest" | "oldest")
                    }
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#26352D] outline-none"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </span>
              </label>
            </div>

            {(startDate || endDate) && (
              <p className="mt-3 text-xs text-[#718077]">
                Date filtering uses the backend normalized date. Displayed
                event dates remain in their original form.
              </p>
            )}

            <p className="mt-3 text-xs text-[#829087]">
              Provider and facility details aren’t included in the timeline
              response.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2EE] pt-4">
              <p aria-live="polite" className="text-sm text-[#718077]">
                {loadState === "ready"
                  ? `${filteredEvents.length} documented ${
                      filteredEvents.length === 1 ? "event" : "events"
                    }`
                  : loadState === "error"
                    ? "History unavailable"
                    : "Loading documented history"}
              </p>
              <div className="flex items-center gap-3">
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
            </div>
          </>
        )}
      </section>

      {isFeatureUnavailable || loadState === "unavailable" ? null : loadState === "loading" ? (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-[#E5ECE6] bg-white p-8 text-sm text-[#52705D]"
        >
          <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
          Loading documented records…
        </div>
      ) : loadState === "error" ? (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-rose-700" size={21} />
            <div>
              <h2 className="font-semibold text-[#26352D]">
                {config.title} couldn’t be loaded
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#718077]">
                The timeline or conflict service returned an error. No sample
                records have been substituted.
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
      ) : filteredEvents.length > 0 ? (
        <ol
          aria-label={`${config.title} timeline`}
          className="relative ml-2 space-y-4 border-l border-[#C7D9CB] pl-5 sm:ml-3 sm:pl-7"
        >
          {filteredEvents.map(({ event }) => (
            <li
              key={`${event.id ?? "event"}-${event.source_doc}-${event.entity}`}
              className="relative"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[27px] top-6 h-3 w-3 rounded-full border-2 border-white bg-[#6C987F] ring-2 ring-[#C7D9CB] sm:-left-[35px]"
              />
              <EventCard event={event} conflicts={conflicts} page={page} />
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          icon={config.icon}
          title={
            hasActiveFilters
              ? "No events match these filters"
              : `No ${config.title.toLowerCase()} events returned`
          }
          description={
            hasActiveFilters
              ? "Try changing your search or filters to see documented events."
              : "The timeline service returned no matching records. This is not a clinical conclusion or a negative finding."
          }
          action={
            hasActiveFilters ? (
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
    </div>
  );
}

function EventCard({
  event,
  conflicts,
  page,
}: {
  event: TimelineEventItem;
  conflicts: ContradictionItem[];
  page: TimelineSection;
}) {
  const eventConflicts = getConflictsForEvent(event, conflicts);

  return (
    <article className="rounded-2xl border border-[#E5ECE6] bg-white p-5 shadow-sm transition hover:border-[#B5CCB8] md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {event.raw_date && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#164A32]">
                <CalendarDays size={15} aria-hidden="true" />
                {event.raw_date}
              </span>
            )}
            {event.category && (
              <span className="rounded-full bg-[#EAF1EB] px-2.5 py-1 text-xs font-medium text-[#45634E]">
                {event.category}
              </span>
            )}
            {event.date_status && event.date_status !== "CONFIDENT" && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
                Date status: {event.date_status}
              </span>
            )}
          </div>

          {event.entity && (
            <h2 className="mt-3 break-words text-lg font-semibold text-[#26352D]">
              {event.entity}
            </h2>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {event.status && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                event.status === "DISCONTINUED"
                  ? "border border-red-200 bg-red-100 text-red-800"
                  : event.status === "TEMPORARILY_HELD"
                    ? "border border-amber-200 bg-amber-100 text-amber-800"
                    : event.status === "DOSE_CHANGED"
                      ? "border border-blue-200 bg-blue-100 text-blue-800"
                      : "border border-emerald-200 bg-emerald-100 text-emerald-800"
              }`}
            >
              {event.status === "DISCONTINUED"
                ? "Stopped"
                : event.status === "TEMPORARILY_HELD"
                  ? "Held"
                  : event.status === "DOSE_CHANGED"
                    ? "Changed"
                    : event.status === "STARTED"
                      ? "Current"
                      : event.status}
            </span>
          )}
          {event.is_reviewed === 1 && (
            <span className="rounded-full border border-[#C7D9CB] bg-[#EAF1EB] px-2.5 py-1 text-xs font-medium text-[#164A32]">
              Clinician reviewed
            </span>
          )}
          {event.is_reviewed === 0 && (
            <span className="rounded-full border border-[#E5ECE6] bg-[#F8FAF8] px-2.5 py-1 text-xs text-[#718077]">
              Not reviewed
            </span>
          )}
          {eventConflicts.map((conflict, index) => (
            <span
              key={`${conflict.id ?? conflict.tier}-${index}`}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${conflictBadgeClass(
                conflict.tier,
              )}`}
            >
              {conflict.tier}
            </span>
          ))}
        </div>
      </div>

      {event.source_passage && (
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#526158]">
          {event.source_passage}
        </p>
      )}

      {(event.raw_value || event.raw_unit || event.normalized_value) && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {(event.raw_value || event.raw_unit) && (
            <p className="text-[#526158]">
              <span className="font-medium">Original value: </span>
              {[event.raw_value, event.raw_unit].filter(Boolean).join(" ")}
            </p>
          )}
          {event.normalized_value && (
            <p className="text-[#718077]">
              <span className="font-medium">Backend normalized value: </span>
              {event.normalized_value}
            </p>
          )}
        </div>
      )}

      {(event.status || event.source_doc) && (
        <div className="mt-5 flex flex-col gap-3 border-t border-[#EEF2EE] pt-4 sm:flex-row sm:items-end sm:justify-between">
          {event.status && (
            <p className="text-xs text-[#718077]">
              {page === "medications" ? "Medication event status: " : "Event status: "}
              <span className="font-medium text-[#526158]">{event.status}</span>
            </p>
          )}
          {event.source_doc && (
            <div className="flex min-w-0 items-start gap-2 text-xs text-[#718077] sm:max-w-[55%]">
              <FileText
                size={15}
                className="mt-0.5 shrink-0 text-[#6C987F]"
                aria-hidden="true"
              />
              <p className="min-w-0 break-words">
                <span className="font-medium text-[#526158]">
                  Source document
                </span>
                <br />
                {event.source_doc}
                {typeof event.page_number === "number" &&
                  ` · Page ${event.page_number}`}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function FeatureUnavailable({ page }: { page: "access" | "profile" }) {
  if (page === "access") {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white p-3 text-[#164A32]">
            <QrCode size={23} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-[#26352D]">
              Sharing isn’t available yet
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#526158]">
              The backend has no access-token or QR creation/revocation route.
              No QR code, token, expiration, or permission scope can be
              generated or confirmed here.
            </p>
            <p className="mt-3 text-xs leading-5 text-[#718077]">
              Required backend contract: an authenticated, patient-scoped
              create-access response containing the QR payload, expiration,
              and permission scope, plus a revoke operation and access-status
              response.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-[#B5CCB8] px-5 py-3 text-sm font-semibold text-[#082818]/60"
        >
          <Share2 size={17} aria-hidden="true" />
          Sharing unavailable
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[#E5ECE6] bg-[#F7F9F7] p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white p-3 text-[#164A32]">
            <Stethoscope size={23} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-[#26352D]">
              Profile information unavailable
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#718077]">
              The backend does not expose a patient profile endpoint. Name,
              date of birth, and contact details are not loaded or invented.
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-[#E5ECE6] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#829087]">
            Required backend contract
          </p>
          <p className="mt-2 text-sm leading-6 text-[#526158]">
            An authenticated patient-profile read response with optional name,
            date of birth, contact, and emergency-contact fields.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5ECE6] bg-white p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
            <HeartPulse size={23} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-[#26352D]">
              Caregivers unavailable
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#718077]">
              No caregiver list or invite, permission-management, or revoke
              endpoint is defined.
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-[#E5ECE6] bg-[#F7F9F7] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#829087]">
            Required backend contract
          </p>
          <p className="mt-2 text-sm leading-6 text-[#526158]">
            Patient-scoped caregiver read and supported invite/update/revoke
            operations, including relationship and permission data.
          </p>
        </div>
      </section>
    </div>
  );
}

function UnavailablePatient() {
  return (
    <div
      role="status"
      className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Patient account is not connected</h2>
          <p className="mt-1 text-sm leading-6">
            This section needs the authenticated or selected patient ID. No
            patient records have been requested or displayed.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: SectionIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-[#E5ECE6] bg-white px-6 py-10 text-center shadow-sm">
      <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
        <Icon size={23} aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-semibold text-[#26352D]">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[#718077]">
        {description}
      </p>
      {action}
    </section>
  );
}
