export type CartStatus = 'IN_SESSION' | 'DISCREPANCY' | 'LOCKED' | 'PAID' | 'OFFLINE' | 'AVAILABLE';

export interface Cart {
  id: string;
  status: CartStatus;
  zone: string;
  itemsCount: number;
  total: number;
  /** 0 means the shopper did not set a budget. */
  budget: number;
  lastEvent: string;
  lastEventAt: string;
  battery: number;
  sessionId: string | null;
}

export const CART_STATUSES: CartStatus[] = ['IN_SESSION', 'DISCREPANCY', 'LOCKED', 'PAID', 'AVAILABLE', 'OFFLINE'];

/** Carts that need a supervisor before the shopper can continue. */
export function needsAttention(cart: Cart): boolean {
  return cart.status === 'DISCREPANCY' || cart.status === 'LOCKED';
}

/** Carts currently used by a shopper (counted as "active" on the dashboard). */
export function isActive(cart: Cart): boolean {
  return cart.status === 'IN_SESSION' || cart.status === 'DISCREPANCY' || cart.status === 'LOCKED' || cart.status === 'PAID';
}
