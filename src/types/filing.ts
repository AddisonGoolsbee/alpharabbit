export interface ShrsOrPrnAmt {
  sshPrnamt: number;
  sshPrnamtType: string;
}

export interface VotingAuthority {
  sole: number;
  shared: number;
  none: number;
}

export interface Holding {
  nameOfIssuer: string;
  titleOfClass: string;
  cusip: string;
  value: number;
  shrsOrPrnAmt: ShrsOrPrnAmt;
  investmentDiscretion: string;
  votingAuthority: VotingAuthority;
}

export interface Filing {
  // Note: JSON seed stores filings as an object keyed by filing-id, so `id` is not required inside each filing object
  cik: string; // 8-digit number as string
  filingDate: string; // ISO date yyyy-mm-dd
  acceptedDate?: string; // ISO datetime with offset
  periodOfReport: string;
  effectivenessDate: string;
  documentLink?: string;
  linkToFiling?: string;
  fundName?: string;
  tableValueTotal: number;
  holdings: Holding[];
}

export type FilingsSeed = Record<string, Filing>;
