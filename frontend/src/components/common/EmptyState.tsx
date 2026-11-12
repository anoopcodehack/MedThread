interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return <div className="rounded-2xl border border-dashed border-sage bg-white p-8 text-center text-sm text-muted">{message}</div>;
}
