import { useEffect, useState } from "react";
import type { HoldingsFile, Holding } from "../utils/types";
import { formatNumber } from "../utils/common";

function HoldingsTable({ holdingsFileKey }: { holdingsFileKey: string }) {
  const [doc, setDoc] = useState<HoldingsFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // e.g. VITE_R2_URL = "https://bucket.accountid.r2.dev"
  const base = String(import.meta.env.VITE_R2_URL ?? "");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        // Join safely; don't encode slashes in the key
        const url = base.replace(/\/$/, "") + "/" + encodeURI(holdingsFileKey);

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`holdings fetch failed: ${res.status}`);

        const body = (await res.json()) as HoldingsFile;

        if (!cancelled) {
          setDoc(body);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [base, holdingsFileKey]);

  if (loading) {
    return <div className="bg-[#141414] rounded-md p-3">Loading holdings…</div>;
  }
  if (error) {
    return (
      <div className="bg-[#141414] rounded-md p-3 text-red-400">
        {error.message}
      </div>
    );
  }
  if (!doc) return null;

  // Convert the holdings object -> array of rows with cusip included
  const rows: Array<{ cusip: string } & Holding> = Object.entries(
    doc.holdings
  ).map(([cusip, h]) => ({ ...h, cusip }));

  return (
    <div className="bg-[#141414] rounded-md p-3">
      {/* Example: you can show meta if desired */}
      {/* <div className="mb-2 text-xs text-gray-400">
        {doc.meta.fundName} • {doc.meta.periodOfReport} • {rows.length} positions
      </div> */}
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
            {rows.map((h) => (
              <tr
                key={h.cusip} // use a stable key (CUSIP)
                className="border-t border-gray-800 hover:bg-gray-900"
              >
                <td className="py-2">{h.nameOfIssuer}</td>
                <td className="py-2">{h.titleOfClass}</td>
                <td className="py-2">{h.cusip}</td>
                <td className="py-2">{formatNumber(Number(h.value ?? 0))}</td>
                <td className="py-2">
                  {formatNumber(Number(h.shrsOrPrnAmt?.sshPrnamt ?? 0))}
                </td>
                <td className="py-2">{h.shrsOrPrnAmt?.sshPrnamtType}</td>
                <td className="py-2">{h.investmentDiscretion}</td>
                <td className="py-2">
                  {formatNumber(Number(h.votingAuthority?.sole ?? 0))}/
                  {formatNumber(Number(h.votingAuthority?.shared ?? 0))}/
                  {formatNumber(Number(h.votingAuthority?.none ?? 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HoldingsTable;
