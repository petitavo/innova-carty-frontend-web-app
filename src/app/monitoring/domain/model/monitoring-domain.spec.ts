import { Alert, isOpen } from './alert.entity';
import { Cart, isActive, needsAttention } from './cart.entity';
import { ShoppingSession, isWeightWithinTolerance, weightDifference } from './shopping-session.entity';

const cart = (status: Cart['status']): Cart => ({
  id: 'CART-0001',
  status,
  zone: 'Aisle 1',
  itemsCount: 1,
  total: 10,
  budget: 0,
  lastEvent: '',
  lastEventAt: '2026-10-03T10:00:00-05:00',
  battery: 90,
  sessionId: null,
});

const session = (expected: number, measured: number, tolerance: number): ShoppingSession => ({
  id: 'ORD-1',
  cartId: 'CART-0001',
  shopper: 'Test',
  status: 'ACTIVE',
  budget: 100,
  total: 10,
  expectedWeight: expected,
  measuredWeight: measured,
  weightTolerance: tolerance,
  startedAt: '2026-10-03T10:00:00-05:00',
  items: [],
});

describe('Cart rules (US11)', () => {
  it('flags discrepancy and locked carts for the supervisor', () => {
    expect(needsAttention(cart('DISCREPANCY'))).toBe(true);
    expect(needsAttention(cart('LOCKED'))).toBe(true);
    expect(needsAttention(cart('IN_SESSION'))).toBe(false);
  });

  it('counts only carts used by a shopper as active', () => {
    expect(isActive(cart('IN_SESSION'))).toBe(true);
    expect(isActive(cart('PAID'))).toBe(true);
    expect(isActive(cart('AVAILABLE'))).toBe(false);
    expect(isActive(cart('OFFLINE'))).toBe(false);
  });
});

describe('Weight check (US11, scenario 2)', () => {
  it('computes the difference between measured and expected weight', () => {
    expect(weightDifference(session(9314, 9726, 266))).toBe(412);
  });

  it('rejects a difference above the tolerance', () => {
    expect(isWeightWithinTolerance(session(9314, 9726, 266))).toBe(false);
  });

  it('accepts a difference inside the tolerance in both directions', () => {
    expect(isWeightWithinTolerance(session(1000, 1010, 30))).toBe(true);
    expect(isWeightWithinTolerance(session(1000, 970, 30))).toBe(true);
  });
});

describe('Alerts', () => {
  it('treats acknowledged alerts as still open', () => {
    const base = { id: 1, cartId: 'C', type: 'WEIGHT', severity: 'WARNING', title: '', description: '', zone: '', createdAt: '' } as const;
    expect(isOpen({ ...base, status: 'OPEN' } as Alert)).toBe(true);
    expect(isOpen({ ...base, status: 'ACKNOWLEDGED' } as Alert)).toBe(true);
    expect(isOpen({ ...base, status: 'RESOLVED' } as Alert)).toBe(false);
  });
});
