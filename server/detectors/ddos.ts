import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

export const ddosDetector: Detector = {
  name: 'Request Flood / DDoS',
  check(req: Request, context: RequestContext): DetectionResult | null {
    let counts = context.requestCountsByIp.get(context.ip) || [];
    const now = Date.now();

    counts.push(now);
    // Keep last 10 seconds
    counts = counts.filter(t => now - t < 10000);
    context.requestCountsByIp.set(context.ip, counts);

    if (counts.length >= 50) {
      // Flag and rate-limit/block globally
      context.blockedIps.add(context.ip);
      
      // Auto-unblock after 30 seconds
      setTimeout(() => {
        context.blockedIps.delete(context.ip);
        context.requestCountsByIp.set(context.ip, []);
      }, 30000);

      return {
        detectorName: this.name,
        severity: 'high',
        reason: `Request flood detected (${counts.length} requests in 10s)`
      };
    }

    return null;
  }
};
