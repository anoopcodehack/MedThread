import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { api } from '../../services/api';

export interface ReviewTargetEvent {
  id: number;
  entity: string;
  category: string;
  status: string;
  currentValue?: string;
  source_doc?: string;
  page_number?: number;
  source_passage?: string;
}

interface ReviewerModalProps {
  isOpen: boolean;
  event: ReviewTargetEvent | null;
  onClose: () => void;
  onSuccess: (updatedEventId: number) => void;
}

export const ReviewerModal: React.FC<ReviewerModalProps> = ({
  isOpen,
  event,
  onClose,
  onSuccess,
}) => {
  const [reviewerName, setReviewerName] = useState('Dr. Ananya Rao');
  const [fieldModified, setFieldModified] = useState<'status' | 'normalized_value'>('status');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('Verified with patient and clinical consultation note');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) {
      setError('Please provide the corrected clinical value.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.reviewEvent(event.id, {
        reviewer_name: reviewerName,
        field_modified: fieldModified,
        new_value: newValue.trim(),
        reason: reason.trim(),
        entity: event.entity,
        original_value: event.currentValue || event.status,
      });
      onSuccess(event.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save review override.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-sage animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-sage">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-forest/10 text-forest">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-forest text-lg">
                Clinician Review & Override
              </h3>
              <p className="text-xs text-muted">
                Audit Trail & Verifiable Evidence Override
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-forest p-1 rounded-lg transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          {/* Target Event Context */}
          <div className="rounded-xl bg-cream p-3.5 border border-sage/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-forest/70">{event.category}</span>
              <span className="text-xs font-mono text-muted">Event #{event.id}</span>
            </div>
            <p className="font-bold text-forest text-base mt-0.5">{event.entity}</p>
            {event.source_passage && (
              <div className="mt-2 text-xs bg-white/80 p-2 rounded border border-sage/60">
                <span className="font-semibold text-slate-600">Raw Source Quote:</span>
                <p className="italic text-slate-800 mt-0.5">"{event.source_passage}"</p>
                {event.source_doc && (
                  <span className="text-[11px] text-forest/80 font-medium flex items-center gap-1 mt-1">
                    <FileText size={12} className="text-forest/70 shrink-0" />
                    <span>{event.source_doc} {event.page_number ? `(p. ${event.page_number})` : ''}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Reviewing Clinician
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
                className="w-full rounded-xl border border-sage px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Field to Override
              </label>
              <select
                value={fieldModified}
                onChange={(e) => setFieldModified(e.target.value as 'status' | 'normalized_value')}
                className="w-full rounded-xl border border-sage px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest"
              >
                <option value="status">Status (STARTED/HELD/DISCONTINUED)</option>
                <option value="normalized_value">Clinical Value / Dosage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              New Corrected Value
            </label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={fieldModified === 'status' ? 'e.g. DISCONTINUED or ACTIVE' : 'e.g. 500 mg BD'}
              required
              className="w-full rounded-xl border border-sage px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Clinical Justification / Audit Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-sage px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-900 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Immutable Evidence Guarantee:</strong> The raw OCR text, document coordinates, and original machine extraction will remain intact. This change will be stored in <code className="font-mono text-emerald-800">review_audit_logs</code>.
            </span>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-sage">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-sage px-4 py-2 text-xs font-semibold text-muted hover:bg-cream transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-5 py-2 text-xs font-bold text-white hover:bg-forest/90 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Audit...
                </>
              ) : (
                'Save Verified Override'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
