// src/hooks/useFilings.ts
import { useCallback, useEffect, useState } from "react";
import type { FilingsMap, Filing, FilingRaw } from "../utils/types"; // Adjust path if needed

// Ensure VITE_R2_URL starts with https:// in your .env file
const base = (import.meta.env.VITE_R2_URL ?? "").toString();
// Make sure the file name matches exactly what your scraper uploads
const FILINGS_URL = `${base}/filings.json`;

// Define the expected shape of the JSON response from R2
type FilingsResponse = {
  filings: FilingRaw[];
};

type UseFilingsResult = {
  data: FilingsMap | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>; // Keep refresh for manual updates
};

export function useFilings(): UseFilingsResult {
  const [data, setData] = useState<FilingsMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log(`Fetching filings from: ${FILINGS_URL}`); // Log the URL

    try {
      // Fetch with no-cache to always get the latest version
      const res = await fetch(FILINGS_URL, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Filings fetch failed: ${res.status} ${res.statusText}`);
      }

      const body: FilingsResponse = await res.json();

      // Basic validation of the response structure
      if (!body || !Array.isArray(body.filings)) {
          throw new Error("Invalid data structure received from filings URL.");
      }

      const result: FilingsMap = {};
      const filingsRaw = body.filings;

      console.log(`Received ${filingsRaw.length} raw filings.`); // Log count

      for (const item of filingsRaw) {
        // More robust check for essential fields
        if (!item || !item.accessionNumber || !item.cik || !item.fundName || !item.periodOfReport) {
            console.warn("Skipping invalid or incomplete filing item:", item);
            continue;
        }

        // --- Parse Dates into Date objects ---
        let filingDate: Date | undefined = undefined;
        console.log(`Raw item.filingDate for ${item.accessionNumber}:`, item.filingDate, `(Type: ${typeof item.filingDate})`);
        if (item.filingDate && typeof item.filingDate === 'string') { // Use new name 'filingDate'
          const parsed = new Date(item.filingDate); // ISO strings parse directly
          if (!isNaN(parsed.getTime())) {
            filingDate = parsed;
          } else {
             console.warn(`Invalid filingDate format for ${item.accessionNumber}: ${item.filingDate}`); // Use new name
          }
        }

        let acceptedDate: Date | undefined = undefined;
        if (item.acceptedDate && typeof item.acceptedDate === 'string') {
          const parsed = new Date(item.acceptedDate);
           if (!isNaN(parsed.getTime())) {
             acceptedDate = parsed;
           } else {
              console.warn(`Invalid acceptedDate format for ${item.accessionNumber}: ${item.acceptedDate}`);
           }
        }

        // Keep periodOfReport as a string (YYYY-MM-DD)
        const periodOfReport = item.periodOfReport ?? undefined;

        // Construct the final Filing object
        const filing: Filing = {
          ...(item as FilingRaw), // Spread raw item first
          accessionNumber: item.accessionNumber,
          cik: String(item.cik), // Ensure CIK is a string
          filingDate: filingDate,
          acceptedDate: acceptedDate,
          periodOfReport: periodOfReport,
          linkToFiling: `https://www.sec.gov/Archives/edgar/data/${
            String(item.cik)
          }/${String(item.accessionNumber).replace(/-/g, "")}/${
            item.accessionNumber
          }-index.htm`,
          fundName: item.fundName,
          tableValueTotal: Number(item.tableValueTotal ?? 0), // Ensure number
          holdingsCount: Number(item.holdingsCount ?? 0), // Ensure number
          // Handle boolean conversion safely
          isAmendment: String(item.isAmendment).toLowerCase() === 'true',
          holdingsFileKey: item.holdingsFileKey, // Pass through the key
        };

        result[item.accessionNumber] = filing;
      }

      console.log(`Successfully processed ${Object.keys(result).length} filings.`); // Log final count
      setData(result);

    } catch (err: unknown) {
      console.error("Error in fetchAll:", err); // Log the specific error
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []); // Dependency array is empty, fetchAll reference is stable

  useEffect(() => {
    void fetchAll(); // Run fetch on initial mount
  }, [fetchAll]); // fetchAll is memoized by useCallback, effect runs once

  return { data, loading, error, refresh: fetchAll };
}

export default useFilings;