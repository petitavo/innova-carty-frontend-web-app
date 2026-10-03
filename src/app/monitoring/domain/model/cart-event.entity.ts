export type EventTone = 'OK' | 'INFO' | 'WARNING' | 'CRITICAL';

export interface CartEvent {
  id: number;
  cartId: string;
  type: string;
  occurredAt: string;
  title: string;
  detail: string;
  tone: EventTone;
}

export interface AuditLog {
  id: number;
  cartId: string;
  action: 'UNLOCK' | 'AUDIT_FLAG';
  resolution: string;
  note: string;
  userId: number;
  createdAt: string;
}
