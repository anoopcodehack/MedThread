import React from 'react';
import { 
  X, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRightLeft, 
  CheckCircle2, 
  Calendar, 
  User, 
  Edit3
} from 'lucide-react';

export interface ContradictionEvidence {
  id: number;
  entity: string;
  tier: string;
  category: string;
  description: string;
  doc1_name: string;
  quote1: string;
  doc2_name: string;
  quote2: string;
}

interface EvidenceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  contradiction: ContradictionEvidence | null;
  onOpenReviewOverride?: () => void;
  patientId?: number;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  isOpen,
  onClose,
  contradiction,
  onOpenReviewOverride,
  patientId = 101
}) => {
  if (!isOpen || !contradiction) return null;

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'DIRECT_CONFLICT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            DIRECT CONFLICT (Opposing Clinical Orders)
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            NEEDS REVIEW (Allergy Discrepancy / Gap)
          </span>
        );
      case 'DUPLICATE_INVESTIGATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-orange-100 text-orange-800 border border-orange-300">
            <ArrowRightLeft className="h-3.5 w-3.5 text-orange-600" />
            DUPLICATE INVESTIGATION (&lt; 72 Hours)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
            {tier}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-forest/10 text-forest">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-forest text-lg">
                  Dual-Document Conflict Comparator
                </h3>
                {getTierBadge(contradiction.tier)}
              </div>
              <p className="text-xs text-muted font-medium mt-0.5">
                Clinical Verification Standard: Direct side-by-side evidence inspection with highlighted raw passages
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            title="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clinical Summary Banner */}
        <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">Clinical Conflict on entity &quot;{contradiction.entity}&quot;: </span>
            <span>{contradiction.description}</span>
          </div>
        </div>

        {/* Split Screen Comparator Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 bg-slate-100/50">
          
          {/* Document 1 Panel */}
          <div className="flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="font-bold text-slate-800 text-xs truncate max-w-[200px]" title={contradiction.doc1_name}>
                  {contradiction.doc1_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`http://localhost:8000/api/documents/raw/${patientId}/${contradiction.doc1_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-forest bg-forest/10 hover:bg-forest/20 px-2 py-0.5 rounded transition"
                  title="Stream original PDF"
                >
                  View PDF ↗
                </a>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Primary Record
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Extracted Verbatim Passage:
                </div>
                <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs text-slate-800 font-mono leading-relaxed relative">
                  <div className="absolute top-2 right-2 text-[10px] font-mono text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                    Quote 1
                  </div>
                  <mark className="bg-amber-200/90 text-amber-950 font-bold px-1 rounded">
                    &ldquo;{contradiction.quote1}&rdquo;
                  </mark>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Provenance: Stored in immutable event log</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Category: <strong className="text-slate-700">{contradiction.category}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Document 2 Panel */}
          <div className="flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="font-bold text-slate-800 text-xs truncate max-w-[200px]" title={contradiction.doc2_name}>
                  {contradiction.doc2_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`http://localhost:8000/api/documents/raw/${patientId}/${contradiction.doc2_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded transition"
                  title="Stream original PDF"
                >
                  View PDF ↗
                </a>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                  Conflicting Record
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Extracted Verbatim Passage:
                </div>
                <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200/80 text-xs text-slate-800 font-mono leading-relaxed relative">
                  <div className="absolute top-2 right-2 text-[10px] font-mono text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded">
                    Quote 2
                  </div>
                  <mark className="bg-rose-200/90 text-rose-950 font-bold px-1 rounded">
                    &ldquo;{contradiction.quote2}&rdquo;
                  </mark>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Provenance: Stored in immutable event log</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Category: <strong className="text-slate-700">{contradiction.category}</strong></span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>MedThread does not silently overwrite conflicting records. Clinician decision required.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Dismiss
            </button>
            {onOpenReviewOverride && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReviewOverride();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-forest text-white hover:bg-forest/90 shadow-xs transition"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Resolve with Clinician Override
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
