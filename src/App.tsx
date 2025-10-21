// src/App.tsx
import React, { useState, useEffect } from "react";
import useFilings from "./hooks/useFilings"; // Adjust path if needed
import type { FilingsMap } from "./utils/types"; // Adjust path if needed
import Loader from "./components/Loader"; // Adjust path if needed
import HoldingsTable from "./components/HoldingsTable"; // Adjust path if needed
import { formatNumber } from "./utils/common"; // Adjust path if needed

// Helper to format Date object into YYYY/MM/DD in EST/EDT
const estDateFormatter = (date: Date): string => {
  // Options to get parts in the target timezone
  const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
  };
  // Use Intl.DateTimeFormat parts to avoid locale-specific order issues
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (year && month && day) {
      return `${year}/${month}/${day}`;
  }
  return 'Invalid Date'; // Fallback
};

export default function App(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(null);

  const {
    data: remoteData,
    loading: remoteLoading,
    error: remoteError,
  } = useFilings();

  // Sort entries by filingDate (descending) before rendering
  const sortedEntries = Object.entries(remoteData ?? ({} as FilingsMap)).sort(
    ([_idA, filingA], [_idB, filingB]) => {
      const dateA = filingA.filingDate?.getTime() ?? 0;
      const dateB = filingB.filingDate?.getTime() ?? 0;
      return dateB - dateA; // Newest first
    }
  );

  // Log error if it occurs
  useEffect(() => {
    if (remoteError) console.error("R2 storage error:", remoteError);
  }, [remoteError]);


  return (
    <div className="min-h-screen p-8 bg-[#242424] text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Filings</h1>

        {/* --- ADD ERROR DISPLAY --- */}
        {remoteError && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{remoteError.message}</span>
          </div>
        )}
        {/* --- END ERROR DISPLAY --- */}

        <div className="bg-[#121212] rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-3">Firm</th>
                  <th className="px-4 py-3">Quarter</th>
                  <th className="px-4 py-3">Filing Date (EST/EDT)</th>
                  <th className="px-4 py-3">Holdings</th>
                  <th className="px-4 py-3">Total Value (USD)</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">CIK</th>
                </tr>
              </thead>
              <tbody>
                {/* Map over sortedEntries */}
                {sortedEntries.map(([id, f]) => (
                  <React.Fragment key={id}>
                    <tr
                      className="border-t border-gray-800 even:bg-transparent odd:bg-transparent hover:bg-gray-900 cursor-pointer"
                      onClick={() => setOpenId(openId === id ? null : id)}
                    >
                      <td className="px-4 py-3">{f.fundName ?? ""}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          // Simplified Quarter Calculation
                          const periodStr = f.periodOfReport;
                          if (!periodStr || typeof periodStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(periodStr)) {
                            return <span className="text-gray-400">-</span>;
                          }
                          const month = parseInt(periodStr.substring(5, 7), 10);
                          if (isNaN(month)) return <span className="text-gray-400">-</span>;
                          const quarter = Math.floor((month - 1) / 3) + 1;
                          return <span className="font-bold">Q{quarter}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          // Correct Filing Date Formatting
                          const d = f.filingDate;
                          if (!d) return <span className="text-gray-400">-</span>;
                          return estDateFormatter(d); // Use the formatter
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2 select-none text-sm text-gray-300">
                          <span className="hover:text-white font-bold">
                            {f.holdingsCount} holding
                            {f.holdingsCount != 1 ? "s" : ""}
                          </span>
                          <svg
                            className={`w-3 h-3 transform transition-transform ${
                              openId === f.accessionNumber ? "rotate-90" : ""
                            }`}
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M6 4L14 10L6 16V4Z" fill="currentColor" />
                          </svg>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {"$" + formatNumber(f.tableValueTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={f.linkToFiling}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline"
                          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
                        >
                          link
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {f.cik}
                      </td>
                    </tr>

                    {/* Holdings Detail Row */}
                    {openId === id && (
                      <tr className="bg-[#0f0f0f]">
                        <td colSpan={7} className="px-4 py-4">
                          {/* Ensure holdingsFileKey is passed correctly */}
                          <HoldingsTable holdingsFileKey={f.holdingsFileKey} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <Loader
              loading={remoteLoading}
              // Don't show empty text if there was an error
              empty={!remoteLoading && !remoteError && sortedEntries.length === 0}
              emptyText="No filings found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}