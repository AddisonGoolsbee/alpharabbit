import type { Holding } from "../types/filing";

// Local holdings DB (seed data)
import holdingsDb from "../data/holdings.json";

type FilingLike = { holdingIds?: string[] } | Record<string, unknown>;

/**
 * Resolve holdings for a filing by looking up each id in the local holdings DB.
 * Only honors `filing.holdingIds`.
 */
export default function getHoldingsForFiling(filing: FilingLike): Holding[] {
  const result: Holding[] = [];
  if (!filing || !Array.isArray(filing.holdingIds)) return result;

  for (const id of filing.holdingIds) {
    const list = (holdingsDb as Record<string, Holding[]>)[id];
    if (Array.isArray(list)) result.push(...list);
  }

  return result;
}
