// useFilings.ts
import { useCallback, useEffect, useState } from "react";
import type { FilingsMap, Filing, FilingsFile } from "../utils/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (import.meta.env.VITE_R2_URL ?? "").toString();
const FILINGS_URL = `${base}/filings.json`;

type FilingsResponse = { filings: unknown };

function toDateFlexible(v: unknown): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  if (typeof v === "number") {
    // Heuristic: seconds vs ms
    return new Date(v > 1e12 ? v : v * 1000);
  }
  if (typeof v === "object") {
    const o = v as any;
    // Firestore Timestamp-like
    if (typeof o.seconds === "number") return new Date(o.seconds * 1000);
    if (typeof o._seconds === "number") return new Date(o._seconds * 1000);
  }
  return undefined;
}

type UseFilingsResult = {
  data: FilingsMap | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useFilings(): UseFilingsResult {
  const [data, setData] = useState<FilingsMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FILINGS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`filings fetch failed: ${res.status}`);
      const body = (await res.json()) as FilingsResponse;

      const result: FilingsMap = {};
      const filingsRaw = (body as FilingsFile).filings;

      for (const item of filingsRaw) {
        if (!item.accessionNumber) continue;

        const filing: Filing = {
          ...item,
          cik: String(item.cik),
          filingDate: toDateFlexible(item.filingDate) ?? new Date(),
          acceptedDate: toDateFlexible(item.acceptedDate),
          periodOfReport: toDateFlexible(item.periodOfReport) ?? new Date(),
          linkToFiling: `https://www.sec.gov/Archives/edgar/data/${
            item.cik
          }/${String(item.accessionNumber).replace(/-/g, "")}/${
            item.accessionNumber
          }-index.htm`,
          fundName: item.fundName,
          tableValueTotal: Number(item.tableValueTotal ?? 0),
          isAmendment: Boolean(item.isAmendment ?? false),
        };

        result[item.accessionNumber] = filing;
      }

      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { data, loading, error, refresh: fetchAll };
}

export default useFilings;
