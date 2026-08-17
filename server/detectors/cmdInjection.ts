import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

const CMD_INJECTION_PATTERN = /(?:;|\||`|\$\().*(?:rm|cat|whoami|ls)\b/i;

export const cmdInjectionDetector: Detector = {
  name: 'Command Injection',
  check(req: Request, context: RequestContext): DetectionResult | null {
    const payloads = [
      ...Object.values(req.query),
      ...Object.values(req.body || {})
    ].filter(v => typeof v === 'string') as string[];

    for (const payload of payloads) {
      if (CMD_INJECTION_PATTERN.test(payload)) {
        return {
          detectorName: this.name,
          severity: 'high',
          matchedPayload: payload.substring(0, 50),
          reason: `Command Injection pattern found: '${payload.substring(0, 20)}...'`
        };
      }
    }

    return null;
  }
};
