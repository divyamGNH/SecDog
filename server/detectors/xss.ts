import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

const XSS_PATTERN = /<script|onerror=|javascript:|<img\s+src=x\s+onerror=/i;

export const xssDetector: Detector = {
  name: 'XSS',
  check(req: Request, context: RequestContext): DetectionResult | null {
    const payloads = [
      ...Object.values(req.query),
      ...Object.values(req.body || {})
    ].filter(v => typeof v === 'string') as string[];

    for (const payload of payloads) {
      if (XSS_PATTERN.test(payload)) {
        return {
          detectorName: this.name,
          severity: 'high',
          matchedPayload: payload.substring(0, 50),
          reason: `XSS pattern found in payload: '${payload.substring(0, 20)}...'`
        };
      }
    }

    return null;
  }
};
