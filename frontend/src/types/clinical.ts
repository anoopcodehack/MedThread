export interface TimelineEventItem {
  id: number;
  patient_id: number;
  document_id: number;
  entity: string;
  category: "MEDICATION" | "LAB" | "CONDITION" | "ALLERGY" | "PROCEDURE";
  status: "STARTED" | "DOSE_CHANGED" | "TEMPORARILY_HELD" | "DISCONTINUED" | "COMPLETED";
  raw_value?: string;
  raw_unit?: string;
  normalized_value?: string;
  raw_date: string;
  normalized_date: string;
  date_status: "CONFIDENT" | "AMBIGUOUS";
  source_doc: string;
  page_number: number;
  source_passage: string;
  is_reviewed: number;
  reviewed_override?: string;
}

export interface ContradictionItem {
  id: number;
  patient_id: number;
  tier: "UPDATED" | "NEEDS_REVIEW" | "DIRECT_CONFLICT" | "DUPLICATE_INVESTIGATION";
  category: string;
  entity: string;
  description: string;
  doc1_name: string;
  quote1: string;
  doc2_name: string;
  quote2: string;
}

export interface CitationItem {
  source_doc: string;
  page_number: number;
  quote: string;
}

export interface QAResponse {
  question: string;
  answer: string;
  status: "GROUNDED_ANSWER" | "NOT_DOCUMENTED";
  citations: CitationItem[];
}
