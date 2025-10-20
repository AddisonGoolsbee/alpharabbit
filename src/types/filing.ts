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
  cik: string;
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
