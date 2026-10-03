export type AlertType = 'GEOFENCE' | 'WEIGHT' | 'RFID' | 'DEVICE';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: number;
  cartId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  zone: string;
  createdAt: string;
  status: AlertStatus;
}

export const ALERT_ICONS: Record<AlertType, string> = {
  GEOFENCE: 'fence',
  WEIGHT: 'scale',
  RFID: 'sell',
  DEVICE: 'battery_alert',
};

export const SEVERITY_TONES: Record<AlertSeverity, 'err' | 'warn' | 'info'> = {
  CRITICAL: 'err',
  WARNING: 'warn',
  INFO: 'info',
};

export function isOpen(alert: Alert): boolean {
  return alert.status !== 'RESOLVED';
}
