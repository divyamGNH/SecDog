import { Detector, RequestContext, DetectionResult } from '../types';
import { Request } from 'express';

export const ssrfDetector: Detector = {
  name: 'SSRF Attempt',
  check(req: Request, context: RequestContext): DetectionResult | null {
    if (req.path === '/fetch' && req.method === 'GET') {
      const urlStr = req.query.url as string;
      if (!urlStr) return null;

      try {
        const urlObj = new URL(urlStr);
        const host = urlObj.hostname;

        // SSRF Target checking
        const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
        const isCloudMetadata = host === '169.254.169.254';
        
        // Basic private IP regex (10.x, 172.16-31.x, 192.168.x)
        const isPrivateIp = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+)$/.test(host);

        if (isLocalhost || isCloudMetadata || isPrivateIp) {
          return {
            detectorName: this.name,
            severity: 'high',
            matchedPayload: host,
            reason: `SSRF attempt to internal/private target: ${host}`
          };
        }
      } catch (e) {
        // Invalid URL, ignore or could be flagged as malformed
      }
    }
    return null;
  }
};
