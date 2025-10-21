// useFilings.ts
import { useCallback, useEffect, useState } from "react";
import type { FilingsMap, Filing } from "../types/filing";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Ensure there's a trailing slash on the base R2 URL if provided
const base = (import.meta.env.VITE_R2_URL ?? "").toString();
const FILINGS_URL = base.endsWith("/")
  ? `${base}filings.json`
  : `${base}/filings.json`;

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
      console.log(res);
      if (!res.ok) throw new Error(`filings fetch failed: ${res.status}`);
      const body = (await res.json()) as FilingsResponse;
      console.log(body);

      const result: FilingsMap = {};
      // The actual R2 payload is { filings: [ { accessionNumber, filedDate, holdingsFileKey, ... }, ... ] }
      const filingsRaw = (body as any)?.filings;

      if (Array.isArray(filingsRaw)) {
        for (const item of filingsRaw) {
          // Incoming item shape (example):
          // { accessionNumber, fundName, cik, filedDate, periodOfReport, tableValueTotal, holdingsCount, isAmendment, holdingsFileKey }
          const id = item?.accessionNumber ?? item?.id ?? undefined;
          if (!id) continue; // skip malformed entries

          const filing: Filing = {
            cik: String(item.cik ?? ""),
            filingDate:
              toDateFlexible(item.filedDate) ??
              toDateFlexible(item.filingDate) ??
              new Date(),
            acceptedDate: undefined,
            periodOfReport: toDateFlexible(item.periodOfReport) ?? new Date(),
            linkToFiling:
              item.linkToFiling ??
              `https://www.sec.gov/Archives/edgar/data/${item.cik}/${String(
                id
              ).replace(/-/g, "")}/${id}-index.htm`,
            fundName: item.fundName ?? item.fund_name ?? "",
            tableValueTotal: Number(
              item.tableValueTotal ?? item.table_value_total ?? 0
            ),
            // The new model exposes a holdingsFileKey (path to a holdings file). Store it as a single-element holdingIds array
            // so downstream code can still look for a holdings reference. You may want to update getHoldingsForFiling later
            // to fetch by holdingsFileKey instead of local ids.
            holdingIds: item.holdingsFileKey
              ? [String(item.holdingsFileKey)]
              : [],
            isAmendment: Boolean(
              item.isAmendment ?? item.is_amendment ?? false
            ),
          };

          result[id] = filing;
        }
      } else if (filingsRaw && typeof filingsRaw === "object") {
        // If server returns a map-like object, where keys are ids
        for (const [id, raw] of Object.entries(filingsRaw)) {
          const filing: Filing = {
            cik: String((raw as any).cik ?? ""),
            filingDate:
              toDateFlexible((raw as any).filedDate) ??
              toDateFlexible((raw as any).filingDate) ??
              new Date(),
            acceptedDate: undefined,
            periodOfReport:
              toDateFlexible((raw as any).periodOfReport) ?? new Date(),
            linkToFiling:
              (raw as any).linkToFiling ??
              `https://www.sec.gov/Archives/edgar/data/${
                (raw as any).cik
              }/${id.replace(/-/g, "")}/${id}-index.htm`,
            fundName: (raw as any).fundName ?? (raw as any).fund_name ?? "",
            tableValueTotal: Number(
              (raw as any).tableValueTotal ??
                (raw as any).table_value_total ??
                0
            ),
            holdingIds: (raw as any).holdingsFileKey
              ? [String((raw as any).holdingsFileKey)]
              : [],
            isAmendment: Boolean(
              (raw as any).isAmendment ?? (raw as any).is_amendment ?? false
            ),
          };

          result[id] = filing;
        }
      } else {
        // unknown shape, nothing to set
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
