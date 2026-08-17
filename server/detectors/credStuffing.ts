import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

export const credStuffingDetector: Detector = {
  name: 'Credential Stuffing',
  check(req: Request, context: RequestContext): DetectionResult | null {
    if (req.path === '/login' && req.method === 'POST') {
      const username = req.body?.username;
      const password = req.body?.password;
      
      if (!username || !password) return null;

      // Only track if it's a failure (toy app logic)
      if (password === 'password123') return null;

      let ipMap = context.credStuffingLogins.get(context.ip);
      if (!ipMap) {
        ipMap = new Map<string, Set<string>>();
        context.credStuffingLogins.set(context.ip, ipMap);
      }

      let usernames = ipMap.get(password);
      if (!usernames) {
        usernames = new Set<string>();
        ipMap.set(password, usernames);
      }

      usernames.add(username);

      if (usernames.size >= 5) {
        return {
          detectorName: this.name,
          severity: 'high',
          matchedPayload: password,
          reason: `Credential stuffing detected (password tried on ${usernames.size} distinct users)`
        };
      }
    }
    return null;
  }
};
