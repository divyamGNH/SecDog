import { Request } from 'express';

export type Severity = 'low' | 'medium' | 'high';

export interface DetectionResult {
  detectorName: string;
  severity: Severity;
  matchedPayload?: string;
  reason: string;
}

export interface RequestContext {
  ip: string;
  failedLoginsByIp: Map<string, number[]>; // ip -> array of timestamps
  credStuffingLogins: Map<string, Map<string, Set<string>>>; // ip -> password -> set of usernames
  requestCountsByIp: Map<string, number[]>; // ip -> array of timestamps
  notFoundCountsByIp: Map<string, number[]>; // ip -> array of timestamps
  blockedIps: Set<string>; // ips that are temporarily blocked
}

export interface Detector {
  name: string;
  check(req: Request, context: RequestContext): DetectionResult | null;
}
