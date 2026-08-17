import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

const PATH_TRAVERSAL_PATTERN = /\.\.\/|\.\.\\|%2e%2e%2f|\/etc\/passwd|C:\\Windows/i;

export const pathTraversalDetector: Detector = {
  name: 'Path Traversal',
  check(req: Request, context: RequestContext): DetectionResult | null {
    const targets = [
      req.originalUrl,
      ...Object.values(req.query),
      ...Object.values(req.body || {})
    ].filter(v => typeof v === 'string') as string[];

    for (const target of targets) {
      if (PATH_TRAVERSAL_PATTERN.test(target)) {
        return {
          detectorName: this.name,
          severity: 'high',
          matchedPayload: target.substring(0, 50),
          reason: `Path Traversal pattern found: '${target.substring(0, 20)}...'`
        };
      }
    }

    return null;
  }
};
