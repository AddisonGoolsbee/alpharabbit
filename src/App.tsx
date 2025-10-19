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
    <table className="holdings-table">
      <thead>
        <tr>
          <th>Issuer</th>
          <th>Class</th>
          <th>CUSIP</th>
          <th>Value</th>
          <th>Shares</th>
          <th>Share Type</th>
          <th>Discretion</th>
          <th>Voting (S/Sh/N)</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((h, idx) => (
          <tr key={idx}>
            <td>{h.nameOfIssuer}</td>
            <td>{h.titleOfClass}</td>
            <td>{h.cusip}</td>
            <td>{formatNumber(h.value)}</td>
            <td>{formatNumber(h.shrsOrPrnAmt?.sshPrnamt)}</td>
            <td>{h.shrsOrPrnAmt?.sshPrnamtType}</td>
            <td>{h.investmentDiscretion}</td>
            <td>
              {formatNumber(h.votingAuthority?.sole)}/
              {formatNumber(h.votingAuthority?.shared)}/
              {formatNumber(h.votingAuthority?.none)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function App(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(null);

  const entries = Object.entries(filingsData);

  return (
    <div className="app-container">
      <h1>Filings</h1>
      <div className="table-wrapper">
        <table className="filings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CIK</th>
              <th>Filing Date</th>
              <th>Accepted</th>
              <th>Period</th>
              <th>Effective</th>
              <th>Fund</th>
              <th>Table Value</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([id, f]) => (
              <React.Fragment key={id}>
                <tr
                  className="filing-row"
                  onClick={() => setOpenId(openId === id ? null : id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{id}</td>
                  <td>{f.cik}</td>
                  <td>{f.filingDate}</td>
                  <td>{f.acceptedDate ?? ""}</td>
                  <td>{f.periodOfReport}</td>
                  <td>{f.effectivenessDate}</td>
                  <td>{f.fundName ?? ""}</td>
                  <td>{formatNumber(f.tableValueTotal)}</td>
                  <td>
                    {f.linkToFiling ? (
                      <a href={f.linkToFiling} target="_blank" rel="noreferrer">
                        filing
                      </a>
                    ) : (
                      f.documentLink && (
                        <a
                          href={f.documentLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          document
                        </a>
                      )
                    )}
                  </td>
                </tr>

                {openId === id && (
                  <tr className="holdings-row">
                    <td colSpan={9}>
                      <HoldingsTable holdings={f.holdings} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">Click a row to toggle holdings</p>
    </div>
  );
}

export default App;
