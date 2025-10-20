import React, { useState } from "react";
import seed from "./data/seed.json";
import type { FilingsSeed, Holding } from "./types/filing";

const filingsData = seed as unknown as FilingsSeed;

function formatNumber(n?: number) {
  if (n == null) return "";
  return n.toLocaleString();
}

function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <div className="bg-[#141414] rounded-md p-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pb-2">Issuer</th>
              <th className="pb-2">Class</th>
              <th className="pb-2">CUSIP</th>
              <th className="pb-2">Value</th>
              <th className="pb-2">Shares</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Discretion</th>
              <th className="pb-2">Voting (S/Sh/N)</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr
                key={i}
                className="border-t border-gray-800 hover:bg-gray-900"
              >
                <td className="py-2">{h.nameOfIssuer}</td>
                <td className="py-2">{h.titleOfClass}</td>
                <td className="py-2">{h.cusip}</td>
                <td className="py-2">{formatNumber(h.value)}</td>
                <td className="py-2">
                  {formatNumber(h.shrsOrPrnAmt?.sshPrnamt)}
                </td>
                <td className="py-2">{h.shrsOrPrnAmt?.sshPrnamtType}</td>
                <td className="py-2">{h.investmentDiscretion}</td>
                <td className="py-2">
                  {formatNumber(h.votingAuthority?.sole)}/
                  {formatNumber(h.votingAuthority?.shared)}/
                  {formatNumber(h.votingAuthority?.none)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(null);
  const entries = Object.entries(filingsData);

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
                          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed))
                            return trimmed.replace(/-/g, "/");
                          const d = new Date(trimmed);
                          if (Number.isNaN(d.getTime()))
                            return <span className="text-gray-400">-</span>;
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, "0");
                          const day = String(d.getDate()).padStart(2, "0");
                          return `${y}/${m}/${day}`;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2 select-none text-sm text-gray-300">
                          <span className="hover:text-white font-bold">
                            {f.holdings?.length ?? 0} holding
                            {f.holdings?.length > 1 ? "s" : ""}
                          </span>
                          <svg
                            className={`w-3 h-3 transform transition-transform ${
                              openId === id ? "rotate-90" : ""
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
                        {f.linkToFiling ? (
                          <a
                            href={f.linkToFiling}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            link
                          </a>
                        ) : (
                          f.documentLink && (
                            <a
                              href={f.documentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              document
                            </a>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {f.cik}
                      </td>
                    </tr>

                    {openId === id && (
                      <tr className="bg-[#0f0f0f]">
                        <td colSpan={7} className="px-4 py-4">
                          <HoldingsTable holdings={f.holdings} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
