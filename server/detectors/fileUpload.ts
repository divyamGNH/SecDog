import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

export const fileUploadDetector: Detector = {
  name: 'Malicious File Upload',
  check(req: Request, context: RequestContext): DetectionResult | null {
    if (req.path === '/upload' && req.method === 'POST') {
      const file = req.file;
      if (!file) return null;

      // Check for magic bytes in buffer
      const buffer = file.buffer;
      if (!buffer) return null;

      // Convert first few bytes to hex string or check specific signatures
      // MZ signature (Windows executable): 4D 5A
      // <?php signature: 3C 3F 70 68 70
      // #!/bin/ signature: 23 21 2F 62 69 6E 2F

      const hex = buffer.toString('hex', 0, 10).toUpperCase();
      const str = buffer.toString('utf-8', 0, 10);

      if (hex.startsWith('4D5A') || str.startsWith('<?php') || str.startsWith('#!/bin/')) {
        return {
          detectorName: this.name,
          severity: 'high',
          matchedPayload: hex.substring(0, 20),
          reason: `Malicious file magic bytes detected (${file.originalname})`
        };
      }
    }
    return null;
  }
};
