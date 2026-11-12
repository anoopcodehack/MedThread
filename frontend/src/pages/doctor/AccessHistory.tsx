import { useEffect, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getAccessHistory } from "../../services/doctorService";
import type { AccessHistoryEntry } from "../../types/doctor";

export default function AccessHistory() {
  const [history, setHistory] = useState<AccessHistoryEntry[]>();
  useEffect(() => { void getAccessHistory().then(setHistory); }, []);
  if (!history) return <LoadingSpinner />;
  return <div className="space-y-6"><div><h1 className="font-heading text-3xl font-extrabold">Access History</h1><p className="mt-2 text-sm text-muted">A record of patient access activity.</p></div><div className="overflow-x-auto rounded-2xl border border-sage bg-white shadow-sm"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-cream text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Patient</th><th className="px-5 py-4">Date and time</th><th className="px-5 py-4">Method</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Access expiry</th></tr></thead><tbody className="divide-y divide-sage">{history.map((item) => <tr key={item.id}><td className="px-5 py-4 font-semibold text-forest">{item.name}<span className="ml-2 text-xs font-normal text-muted">{item.id}</span></td><td className="px-5 py-4 text-muted">{item.accessedAt}</td><td className="px-5 py-4 text-muted">{item.method}</td><td className="px-5 py-4 text-forest">{item.status}</td><td className="px-5 py-4 text-muted">{item.expiresAt}</td></tr>)}</tbody></table></div></div>;
}
