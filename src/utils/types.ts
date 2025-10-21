import type { Timestamp } from "firebase/firestore";

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

export interface HoldingsFile {
  meta: FilingRaw;
  holdings: Record<string /* cusip */, Holding>;
}

export interface FilingRaw {
  accessionNumber: string;
  cik: string;
  filingDate: Timestamp;
  acceptedDate?: Timestamp;
  periodOfReport: Timestamp;
  fundName: string;
  tableValueTotal: number;
  holdingsCount: number;
  isAmendment: boolean;
  holdingsFileKey: string;
}

export interface FilingsFile {
  filings: FilingRaw[];
}

export interface Filing {
  accessionNumber: string;
  cik: string;
  filingDate: Date;
  acceptedDate?: Date;
  periodOfReport: Date;
  linkToFiling: string;
  fundName: string;
  tableValueTotal: number;
  holdingsCount: number;
  isAmendment: boolean;
  holdingsFileKey: string;
}

export type FilingsMap = Record<string, Filing>;
