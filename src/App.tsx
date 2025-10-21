import React, { useState, useEffect } from "react";
import useFilings from "./hooks/useFilings";
import type { FilingsMap } from "./utils/types";
import Loader from "./components/Loader";
import HoldingsTable from "./components/HoldingsTable";
import { formatNumber } from "./utils/common";

export default function App(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(null);

  const {
    data: remoteData,
    loading: remoteLoading,
    error: remoteError,
  } = useFilings();

  useEffect(() => {
    if (remoteError) console.error("Firestore error:", remoteError);
  }, [remoteData, remoteLoading, remoteError]);
  const entries = Object.entries(remoteData ?? ({} as FilingsMap));

  return (
    <div className="min-h-screen p-8 bg-[#242424] text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Filings</h1>

        <div className="bg-[#121212] rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-3">Firm</th>
                  <th className="px-4 py-3">Quarter</th>
                  <th className="px-4 py-3">Filing Date</th>
                  <th className="px-4 py-3">Holdings</th>
                  <th className="px-4 py-3">Total Value (USD)</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">CIK</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([id, f]) => (
                  <React.Fragment key={id}>
                    <tr
                      className="border-t border-gray-800 even:bg-transparent odd:bg-transparent hover:bg-gray-900 cursor-pointer"
                      onClick={() => setOpenId(openId === id ? null : id)}
                    >
                      <td className="px-4 py-3">{f.fundName ?? ""}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const d = f.periodOfReport
                            ? new Date(f.periodOfReport)
                            : null;
                          if (!d || Number.isNaN(d.getTime()))
                            return <span className="text-gray-400">-</span>;
                          const quarter = Math.floor(d.getMonth() / 3) + 1;
                          return <span className="font-bold">Q{quarter}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const s = f.filingDate;
                          if (!s)
                            return <span className="text-gray-400">-</span>;
                          const trimmed = String(s).trim();
                          let d: Date;
                          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                            // Treat as UTC midnight
                            d = new Date(trimmed + "T00:00:00Z");
                          } else {
                            d = new Date(trimmed);
                          }
                          if (Number.isNaN(d.getTime()))
                            return <span className="text-gray-400">-</span>;
                          // Convert to EST (UTC-5, ignoring DST for simplicity)
                          const estDate = new Date(
                            d.getTime() - 5 * 60 * 60 * 1000
                          );
                          const y = estDate.getFullYear();
                          const m = String(estDate.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const day = String(estDate.getDate()).padStart(
                            2,
                            "0"
                          );
                          return `${y}/${m}/${day}`;
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
                          onClick={(e) => e.stopPropagation()}
                        >
                          link
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {f.cik}
                      </td>
                    </tr>

                    {openId === id && (
                      <tr className="bg-[#0f0f0f]">
                        <td colSpan={7} className="px-4 py-4">
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
              empty={!remoteLoading && entries.length === 0}
              emptyText="No filings found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
