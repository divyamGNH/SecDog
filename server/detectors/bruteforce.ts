import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

export const bruteforceDetector: Detector = {
  name: 'Brute-Force Login',
  check(req: Request, context: RequestContext): DetectionResult | null {
    if (req.path === '/login' && req.method === 'POST') {
      const username = req.body?.username;
      const password = req.body?.password;
      
      if (!username || !password) return null;

      const key = `${context.ip}:${username}`;
      let timestamps = context.failedLoginsByIp.get(key) || [];
      const now = Date.now();

      // We assume any password other than 'password123' is a failure for the toy app
      if (password !== 'password123') {
        timestamps.push(now);
      }

      // Keep only last 30 seconds
      timestamps = timestamps.filter(t => now - t < 30000);
      context.failedLoginsByIp.set(key, timestamps);

      if (timestamps.length >= 5) {
        return {
          detectorName: this.name,
          severity: 'high',
          matchedPayload: username,
          reason: `Brute-force detected for user '${username}' (${timestamps.length} fails in 30s)`
        };
      }
    }
    return null;
  }
};
