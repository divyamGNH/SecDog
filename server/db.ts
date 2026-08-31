import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/sentinelapi';

const pool = new Pool({ connectionString });

export interface AlertRecord {
  source_ip: string;
  detector_name: string;
  severity: string;
  matched_payload: string;
  request_path: string;
  reason: string;
}

export interface Alert extends AlertRecord {
  id: number;
  timestamp: Date;
}

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      source_ip TEXT NOT NULL,
      detector_name TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
      matched_payload TEXT NOT NULL DEFAULT '',
      request_path TEXT NOT NULL,
      reason TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS alerts_timestamp_idx
    ON alerts (timestamp DESC)
  `);
}

export async function insertAlert(alert: AlertRecord) {
  const result = await pool.query<Alert>(
    `INSERT INTO alerts
      (source_ip, detector_name, severity, matched_payload, request_path, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      alert.source_ip,
      alert.detector_name,
      alert.severity,
      alert.matched_payload || '',
      alert.request_path,
      alert.reason
    ]
  );

  return result.rows[0];
}

export async function getAlerts() {
  const result = await pool.query<Alert>(
    'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 100'
  );
  return result.rows;
}

export async function closeDatabase() {
  await pool.end();
}
