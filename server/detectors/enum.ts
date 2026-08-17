import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

export const enumDetector: Detector = {
  name: 'Endpoint Enumeration',
  // The actual logic is handled inside middleware.ts listening to the res.on('finish') event.
  // We keep this module to export the Detector definition for the pipeline array.
  check(req: Request, context: RequestContext): DetectionResult | null {
    return null;
  }
};
