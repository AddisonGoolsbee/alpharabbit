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
    <div className="bg-[#1f1f1f] rounded-md p-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-left text-gray-300">
              <th className="pb-2">Issuer</th>
              <th className="pb-2">Class</th>
              <th className="pb-2">CUSIP</th>
              <th className="pb-2">Value</th>
              <th className="pb-2">Shares</th>
              <th className="pb-2">Share Type</th>
              <th className="pb-2">Discretion</th>
              <th className="pb-2">Voting (S/Sh/N)</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, idx) => (
              <tr
                key={idx}
                className="border-t border-gray-700 even:bg-transparent odd:bg-transparent"
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

function App(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(null);

  const entries = Object.entries(filingsData);

  return (
    <div className="min-h-screen p-8 bg-[#242424] text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Filings</h1>

        <div className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-300">
                  <th className="px-4 py-3"> </th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">CIK</th>
                  <th className="px-4 py-3">Filing Date</th>
                  <th className="px-4 py-3">Accepted</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Effective</th>
                  <th className="px-4 py-3">Fund</th>
                  <th className="px-4 py-3">Table Value</th>
                  <th className="px-4 py-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([id, f]) => (
                  <React.Fragment key={id}>
                    <tr className="border-t border-gray-800">
                      <td className="px-4 py-3 w-12">
                        <button
                          onClick={() => setOpenId(openId === id ? null : id)}
                          className="p-1 rounded hover:bg-gray-700"
                          aria-label={openId === id ? "Collapse" : "Expand"}
                        >
                          <svg
                            className={`w-4 h-4 transform transition-transform ${
                              openId === id ? "rotate-90" : ""
                            }`}
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M6 4L14 10L6 16V4Z" fill="currentColor" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono">{id}</td>
                      <td className="px-4 py-3">{f.cik}</td>
                      <td className="px-4 py-3">{f.filingDate}</td>
                      <td className="px-4 py-3">{f.acceptedDate ?? ""}</td>
                      <td className="px-4 py-3">{f.periodOfReport}</td>
                      <td className="px-4 py-3">{f.effectivenessDate}</td>
                      <td className="px-4 py-3">{f.fundName ?? ""}</td>
                      <td className="px-4 py-3">
                        {formatNumber(f.tableValueTotal)}
                      </td>
                      <td className="px-4 py-3">
                        {f.linkToFiling ? (
                          <a
                            href={f.linkToFiling}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline"
                          >
                            filing
                          </a>
                        ) : (
                          f.documentLink && (
                            <a
                              href={f.documentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:underline"
                            >
                              document
                            </a>
                          )
                        )}
                      </td>
                    </tr>

                    {openId === id && (
                      <tr className="bg-[#0f0f0f]">
                        <td colSpan={10} className="px-4 py-4">
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

export default App;
