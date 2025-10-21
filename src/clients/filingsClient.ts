// dataClient/filingsClient.ts
import type { Filing, FilingsMap } from "../types/filing";

type FilingsState =
  | { status: "idle"; data: null; etag: string | null; error: null }
  | {
      status: "loading";
      data: FilingsMap | null;
      etag: string | null;
      error: null;
    }
  | { status: "ready"; data: FilingsMap; etag: string | null; error: null }
  | {
      status: "error";
      data: FilingsMap | null;
      etag: string | null;
      error: Error;
    };

const URL = import.meta.env.VITE_R2_URL as string;

class FilingsClient {
  private state: FilingsState = {
    status: "idle",
    data: null,
    etag: null,
    error: null,
  };
  private subs = new Set<() => void>();
  private inflight: Promise<void> | null = null;
  private timer: number | null = null;

  subscribe = (fn: () => void) => {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  };
  getSnapshot = () => this.state;

  private emit() {
    this.subs.forEach((fn) => fn());
  }

  start() {
    if (this.timer != null) return;
    // immediate load then poll every 5 min
    this.refresh().catch(() => {});
    this.timer = window.setInterval(
      () => this.refresh().catch(() => {}),
      5 * 60 * 1000
    );
  }

  stop() {
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private mapRawToFilingsMap(raw: Record<string, unknown>): FilingsMap {
    const result: FilingsMap = {};
    if (!raw || typeof raw !== "object") return result;
    Object.entries(raw).forEach(([id, entry]) => {
      // entry shape is dynamic; allow explicit any only for this mapping line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r: any = entry as any;
      // The local file stores timestamps as { seconds, nanoseconds }
      const filing: Filing = {
        cik: String(r.cik ?? ""),
        filingDate: r.filingDate?.seconds
          ? new Date(r.filingDate.seconds * 1000)
          : new Date(r.filingDate),
        acceptedDate: r.acceptedDate?.seconds
          ? new Date(r.acceptedDate.seconds * 1000)
          : r.acceptedDate
          ? new Date(r.acceptedDate)
          : undefined,
        periodOfReport: r.periodOfReport?.seconds
          ? new Date(r.periodOfReport.seconds * 1000)
          : new Date(r.periodOfReport),
        linkToFiling:
          r.linkToFiling ??
          `https://www.sec.gov/Archives/edgar/data/${r.cik}/${id.replace(
            /-/g,
            ""
          )}/${id}-index.htm`,
        fundName: r.fundName ?? r.fund_name ?? r.fund ?? "",
        tableValueTotal: Number(r.tableValueTotal ?? r.table_value_total ?? 0),
        holdingIds: (r.holdingIds ?? r.holdings ?? []) as string[],
        isAmendment: Boolean(r.isAmendment ?? r.is_amendment ?? false),
      };
      result[id] = filing;
    });
    return result;
  }

  async refresh() {
    if (this.inflight) return this.inflight;
    if (this.state.data) {
      this.state = {
        status: "ready",
        data: this.state.data,
        etag: this.state.etag,
        error: null,
      };
    } else {
      this.state = {
        status: "loading",
        data: null,
        etag: this.state.etag,
        error: null,
      };
    }
    this.emit();

    this.inflight = (async () => {
      try {
        // Use HEAD to read the current ETag (optional but cheap)
        const head = await fetch(URL, { method: "HEAD", cache: "no-store" });
        const remoteEtag = head.headers.get("etag");

        // If etag matches what we have, no need to GET
        if (remoteEtag && remoteEtag === this.state.etag && this.state.data) {
          // unchanged
          return;
        }

        // GET, using If-None-Match with the stored etag if present
        const headers: Record<string, string> = {};
        if (this.state.etag) headers["If-None-Match"] = this.state.etag;

        const res = await fetch(URL, { cache: "no-store", headers });

        if (res.status === 304 && this.state.data) {
          // not modified
          this.state = {
            status: "ready",
            data: this.state.data,
            etag: remoteEtag ?? this.state.etag,
            error: null,
          };
          this.emit();
          return;
        }

        if (!res.ok) throw new Error(`filings fetch failed: ${res.status}`);
        const json = await res.json();
        const etag = res.headers.get("etag") ?? remoteEtag ?? null;
        const mapped = this.mapRawToFilingsMap(json);
        this.state = { status: "ready", data: mapped, etag, error: null };
        this.emit();
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.state = {
          status: "error",
          data: this.state.data,
          etag: this.state.etag,
          error,
        };
        this.emit();
      } finally {
        this.inflight = null;
      }
    })();

    return this.inflight;
  }
}

export const filingsClient = new FilingsClient();
