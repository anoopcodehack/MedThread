import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownWideNarrow,
  CalendarDays,
  FileText,
  FilterX,
  History,
  LoaderCircle,
  RotateCcw,
  Search,
} from "lucide-react";
import { api } from "../../services/api";
import type { ContradictionItem, TimelineEventItem } from "../../types/clinical";

type LoadState = "unavailable" | "loading" | "ready" | "error";
type SortOrder = "newest" | "oldest";
type StatusFilter = "all" | "reviewed" | "not-reviewed" | `conflict:${string}`;

interface Props {
  patientId?: number;
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

function conflictBadgeClass(tier: string): string {
  if (tier === "DIRECT_CONFLICT") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (tier === "NEEDS_REVIEW") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-[#DCE8DE] bg-[#F1F6F1] text-[#45634E]";
}

export default function MedicalHistoryPage({ patientId }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [conflicts, setConflicts] = useState<ContradictionItem[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const hasPatientId =
    typeof patientId === "number" &&
    Number.isSafeInteger(patientId) &&
    patientId > 0;

  useEffect(() => {
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
  }, [hasPatientId, patientId, retryCount]);

  const categories = useMemo(
    () => [...new Set(events.map((event) => event.category))].sort(),
    [events],
  );

  const conflictTiers = useMemo(
    () => [...new Set(conflicts.map((conflict) => conflict.tier))].sort(),
    [conflicts],
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return events
      .filter((event) => {
        if (category !== "all" && event.category !== category) return false;

        if (normalizedSearch) {
          const searchableValues = [
            event.entity,
            event.category,
            event.status,
            event.raw_date,
            event.source_doc,
            event.source_passage,
          ];
          const matches = searchableValues.some((value) =>
            value?.toLocaleLowerCase().includes(normalizedSearch),
          );
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
        if (statusFilter.startsWith("conflict:")) {
          const tier = statusFilter.slice("conflict:".length);
          const eventConflicts = getConflictsForEvent(event, conflicts);
          if (!eventConflicts.some((conflict) => conflict.tier === tier)) {
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
      });
  }, [
    category,
    conflicts,
    endDate,
    events,
    search,
    sortOrder,
    startDate,
    statusFilter,
  ]);

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

  if (loadState === "unavailable") {
    return (
      <section
        aria-labelledby="history-heading"
        className="rounded-2xl border border-[#E5ECE6] bg-white p-6 shadow-sm md:p-8"
      >
        <PageHeading />
        <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <h2 className="font-semibold">Patient account is not connected</h2>
              <p className="mt-1 text-sm leading-6">
                Medical history can’t be requested because this portal has no
                authenticated or selected patient ID. No patient records have
                been loaded.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="history-heading"
        className="rounded-2xl border border-[#E5ECE6] bg-white p-5 shadow-sm md:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeading />
          <label className="flex shrink-0 items-center gap-2 text-sm text-[#52705D]">
            <ArrowDownWideNarrow size={17} aria-hidden="true" />
            <span className="sr-only">Timeline order</span>
            <select
              aria-label="Timeline order"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="rounded-lg border border-[#DCE8DE] bg-white px-3 py-2 text-sm text-[#26352D] outline-none focus:border-[#6C987F] focus:ring-2 focus:ring-[#6C987F]/20"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="sm:col-span-2 xl:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
              Search medical history
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[#DCE8DE] px-3 focus-within:border-[#6C987F] focus-within:ring-2 focus-within:ring-[#6C987F]/20">
              <Search size={17} className="shrink-0 text-[#829087]" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events, notes or documents"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-[#26352D] outline-none placeholder:text-[#9AA69E]"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-[#52705D]">
              From date
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[#DCE8DE] px-3 focus-within:border-[#6C987F] focus-within:ring-2 focus-within:ring-[#6C987F]/20">
              <CalendarDays size={16} className="shrink-0 text-[#829087]" aria-hidden="true" />
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
              <CalendarDays size={16} className="shrink-0 text-[#829087]" aria-hidden="true" />
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
              Event category
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
              Review / reconciliation status
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
              {conflictTiers.map((tier) => (
                <option key={tier} value={`conflict:${tier}`}>
                  {tier}
                </option>
              ))}
            </select>
          </label>

          <div>
            <label
              htmlFor="provider-filter"
              className="mb-1.5 block text-xs font-semibold text-[#52705D]"
            >
              Provider / facility
            </label>
            <select
              id="provider-filter"
              disabled
              aria-describedby="provider-filter-note"
              className="w-full cursor-not-allowed rounded-lg border border-[#E5ECE6] bg-[#F8FAF8] px-3 py-2.5 text-sm text-[#829087]"
            >
              <option>Unavailable in current API</option>
            </select>
            <p id="provider-filter-note" className="mt-1 text-xs text-[#829087]">
              Provider details aren’t included in the timeline response.
            </p>
          </div>
        </div>

        {(startDate || endDate) && (
          <p className="mt-3 text-xs text-[#718077]">
            Date range uses the backend-provided normalized date. Events without
            a valid normalized date won’t match this range; displayed dates
            remain unchanged from the source record.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2EE] pt-4">
          <p aria-live="polite" className="text-sm text-[#718077]">
            {loadState === "ready"
              ? `${filteredEvents.length} of ${events.length} documented ${
                  events.length === 1 ? "event" : "events"
                }`
              : "Loading documented history"}
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
      </section>

      {loadState === "loading" && (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-[#E5ECE6] bg-white p-8 text-sm text-[#52705D]"
        >
          <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
          Loading medical history…
        </div>
      )}

      {loadState === "error" && (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-rose-700" size={21} />
            <div className="flex-1">
              <h2 className="font-semibold text-[#26352D]">
                Medical history couldn’t be loaded
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#718077]">
                The timeline or reconciliation service returned an error. Your
                records haven’t been replaced with sample data.
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

      {loadState === "ready" && events.length === 0 && (
        <EmptyState
          icon="history"
          title="No documented medical history"
          description="The history service returned no events for this patient. No clinical records are being inferred or shown."
        />
      )}

      {loadState === "ready" &&
        events.length > 0 &&
        filteredEvents.length === 0 && (
          <EmptyState
            icon="filter"
            title="No events match these filters"
            description="Try changing your search or filters to see documented events."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-[#B5CCB8] px-4 py-2 text-sm font-semibold text-[#164A32] hover:bg-[#EAF1EB] focus:outline-none focus:ring-2 focus:ring-[#6C987F]"
              >
                Clear filters
              </button>
            }
          />
        )}

      {loadState === "ready" && filteredEvents.length > 0 && (
        <ol
          aria-label="Chronological medical history"
          className="relative ml-2 space-y-4 border-l border-[#C7D9CB] pl-5 sm:ml-3 sm:pl-7"
        >
          {filteredEvents.map(({ event }) => {
            const eventConflicts = getConflictsForEvent(event, conflicts);

            return (
              <li key={`${event.id ?? "event"}-${event.source_doc}-${event.entity}`} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[27px] top-6 h-3 w-3 rounded-full border-2 border-white bg-[#6C987F] ring-2 ring-[#C7D9CB] sm:-left-[35px]"
                />
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
                        {event.date_status &&
                          event.date_status !== "CONFIDENT" && (
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
                    <div className="mt-4 p-3 rounded-xl bg-[#F6F9F6] border border-[#E0EBE2] text-sm text-[#3E5245] font-mono leading-relaxed">
                      <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#6C987F] block mb-1">
                        Verbatim Source Quote:
                      </span>
                      &ldquo;{event.source_passage}&rdquo;
                    </div>
                  )}

                  {(event.status || event.source_doc) && (
                    <div className="mt-5 flex flex-col gap-3 border-t border-[#EEF2EE] pt-4 sm:flex-row sm:items-end sm:justify-between">
                      {event.status && (
                        <p className="text-xs text-[#718077]">
                          Event status:{" "}
                          <span className="font-medium text-[#526158]">
                            {event.status}
                          </span>
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
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function PageHeading() {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-[#EAF1EB] p-3 text-[#164A32]">
        <History size={22} aria-hidden="true" />
      </div>
      <div>
        <h1 id="history-heading" className="text-xl font-semibold text-[#26352D]">
          Complete Medical History
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#718077]">
          Review events documented in the patient’s records, with source
          references and backend-provided review status.
        </p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: "history" | "filter";
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = icon === "history" ? Activity : FilterX;

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