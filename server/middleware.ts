import { Request, Response, NextFunction } from 'express';
import { RequestContext, Detector, DetectionResult } from './types';
import { insertAlert } from './db';

// Import detectors (to be implemented)
import { sqlInjectionDetector } from './detectors/sqli';
import { xssDetector } from './detectors/xss';
import { pathTraversalDetector } from './detectors/pathTraversal';
import { cmdInjectionDetector } from './detectors/cmdInjection';
import { bruteforceDetector } from './detectors/bruteforce';
import { credStuffingDetector } from './detectors/credStuffing';
import { ddosDetector } from './detectors/ddos';
import { ssrfDetector } from './detectors/ssrf';
import { fileUploadDetector } from './detectors/fileUpload';
import { scannerDetector } from './detectors/scanner';
import { enumDetector } from './detectors/enum';

// Global state for stateful detectors
const globalContextState = {
  failedLoginsByIp: new Map<string, number[]>(),
  credStuffingLogins: new Map<string, Map<string, Set<string>>>(),
  requestCountsByIp: new Map<string, number[]>(),
  notFoundCountsByIp: new Map<string, number[]>(),
  blockedIps: new Set<string>()
};

// Ordered chain of detectors
const detectors: Detector[] = [
  ddosDetector,
  scannerDetector,
  sqlInjectionDetector,
  xssDetector,
  pathTraversalDetector,
  cmdInjectionDetector,
  bruteforceDetector,
  credStuffingDetector,
  ssrfDetector,
  fileUploadDetector,
  enumDetector // Not technically possible to run effectively on request entry if it tracks 404s, but we'll adapt it.
];

export async function sentinelMiddleware(req: Request, res: Response, next: NextFunction) {
  // Monitoring endpoints must stay reachable even when the local attack
  // simulator temporarily blocks its own localhost IP during the DDoS demo.
  if (req.path === '/alerts' || req.path.startsWith('/alerts/')) {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  const context: RequestContext = {
    ip,
    ...globalContextState
  };

  // If globally blocked by DDoS
  if (context.blockedIps.has(ip)) {
    return res.status(403).json({ error: 'Forbidden: IP temporarily blocked.' });
  }

  let isBlocked = false;

  for (const detector of detectors) {
    try {
      const result = detector.check(req, context);
      
      if (result) {
        // Log alert
        await insertAlert({
          source_ip: ip,
          detector_name: result.detectorName,
          severity: result.severity,
          matched_payload: result.matchedPayload || '',
          request_path: req.originalUrl,
          reason: result.reason
        });

        // Broadcast to SSE clients (will implement an EventEmitter in index.ts)
        req.app.emit('new-alert');

        if (result.severity === 'high') {
          isBlocked = true;
          return res.status(403).json({ error: 'Forbidden: Malicious activity detected.' });
        }
      }
    } catch (err) {
      console.error(`Detector ${detector.name} failed:`, err);
    }
  }

  if (!isBlocked) {
    // We need to capture 404s for the enumDetector.
    // We'll hook into the response finish event.
    res.on('finish', async () => {
      if (res.statusCode === 404) {
        // Track 404s
        let counts = context.notFoundCountsByIp.get(ip) || [];
        const now = Date.now();
        counts.push(now);
        // keep last 20s
        counts = counts.filter(t => now - t < 20000);
        context.notFoundCountsByIp.set(ip, counts);

        if (counts.length >= 15) {
          // Flag as enumeration
          try {
            await insertAlert({
              source_ip: ip,
              detector_name: enumDetector.name,
              severity: 'medium',
              matched_payload: '',
              request_path: req.originalUrl,
              reason: `Endpoint enumeration detected (${counts.length} 404s in 20s)`
            });
            req.app.emit('new-alert');
          } catch (err) {
            console.error('Failed to log endpoint enumeration alert:', err);
          }
          // clear counts after alerting to prevent spam
          context.notFoundCountsByIp.set(ip, []);
        }
      }
    });

    next();
  }
}
