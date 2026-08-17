import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AlertRecord {
  source_ip: string;
  detector_name: string;
  severity: string;
  matched_payload: string;
  request_path: string;
  reason: string;
}

export async function insertAlert(alert: AlertRecord) {
  await prisma.alert.create({
    data: {
      source_ip: alert.source_ip,
      detector_name: alert.detector_name,
      severity: alert.severity,
      matched_payload: alert.matched_payload || '',
      request_path: alert.request_path,
      reason: alert.reason
    }
  });
}

export async function getAlerts() {
  return await prisma.alert.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100
  });
}

export default prisma;
