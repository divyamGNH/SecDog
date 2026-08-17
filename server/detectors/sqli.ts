import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

const SQLI_PATTERN = /(?:'|%27)\s*(?:OR|UNION|--|;|DROP|SELECT)|(?:UNION\s+SELECT)|(?:;--)/i;

export const sqlInjectionDetector: Detector = {
  name: 'SQL Injection',
  check(req: Request, context: RequestContext): DetectionResult | null {
    const payloads = [
      ...Object.values(req.query),
      ...Object.values(req.body || {})
    ].filter(v => typeof v === 'string') as string[];

    for (const payload of payloads) {
      if (SQLI_PATTERN.test(payload)) {
        return {
          detectorName: this.name,
          severity: 'high',
          matchedPayload: payload.substring(0, 50),
          reason: `SQLi pattern found in payload: '${payload.substring(0, 20)}...'`
        };
      }
    }

    return null;
  }
};
