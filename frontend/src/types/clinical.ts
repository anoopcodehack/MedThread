export interface TimelineEventItem {
  id?: number | null;
  patient_id: number;
  document_id?: number | null;
  entity: string;
  category: string;
  status: string;
  raw_value?: string | null;
  raw_unit?: string | null;
  normalized_value?: string | null;
  raw_date: string;
  normalized_date: string;
  date_status?: string;
  source_doc: string;
  page_number?: number;
  source_passage: string;
  is_reviewed: number;
  reviewed_override?: string | null;
}

export interface ContradictionItem {
  id?: number | null;
  patient_id: number;
  tier: string;
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
