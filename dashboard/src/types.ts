export type Severity = 'low' | 'medium' | 'high';

export interface Alert {
  id: string | number;
  timestamp: string;
  detector_name: string;
  severity: Severity;
  source_ip: string;
  request_path: string;
  reason: string;
  matched_payload?: string;
}
