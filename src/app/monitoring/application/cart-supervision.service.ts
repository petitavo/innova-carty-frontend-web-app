import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../iam/infrastructure/auth.service';
import { Alert } from '../domain/model/alert.entity';
import { AuditLog } from '../domain/model/cart-event.entity';
import { Cart } from '../domain/model/cart.entity';
import { ShoppingSession } from '../domain/model/shopping-session.entity';
import { AlertsApi, AuditLogsApi, CartEventsApi, CartsApi, ShoppingSessionsApi } from '../infrastructure/monitoring-api';

export interface UnlockCartCommand {
  cart: Cart;
  session: ShoppingSession | null;
  openAlerts: Alert[];
  resolution: string;
  pin: string;
  note: string;
}

/** Supervisor actions on a cart (US11, scenario 2: verify and unlock). */
@Injectable({ providedIn: 'root' })
export class CartSupervisionService {
  private readonly auth = inject(AuthService);
  private readonly carts = inject(CartsApi);
  private readonly sessions = inject(ShoppingSessionsApi);
  private readonly alerts = inject(AlertsApi);
  private readonly events = inject(CartEventsApi);
  private readonly auditLogs = inject(AuditLogsApi);

  /** Verifies the PIN, puts the cart back in session, resolves its alerts and writes the audit log. */
  unlock(command: UnlockCartCommand): Observable<Cart> {
    const { cart, session, openAlerts, resolution, note } = command;
    const now = new Date().toISOString();
    const supervisor = this.auth.currentUser()?.fullName ?? 'Supervisor';

    return this.auth.verifySupervisorPin(command.pin).pipe(
      switchMap(() =>
        forkJoin([
          this.carts.update(cart.id, {
            status: cart.sessionId ? 'IN_SESSION' : 'AVAILABLE',
            lastEvent: `Unlocked by ${supervisor}`,
            lastEventAt: now,
          }),
          session && cart.status === 'DISCREPANCY'
            ? this.sessions.update(session.id, { measuredWeight: session.expectedWeight })
            : of(null),
          ...openAlerts.map((alert) => this.alerts.update(alert.id, { status: 'RESOLVED' })),
          this.events.create({
            cartId: cart.id,
            type: 'UNLOCK',
            occurredAt: now,
            title: `Unlocked by ${supervisor}`,
            detail: resolution,
            tone: 'OK',
          }),
          this.auditLogs.create(this.auditEntry(cart.id, 'UNLOCK', resolution, note, now)),
        ]),
      ),
      map(([updated]) => updated),
    );
  }

  flagForAudit(cart: Cart, note: string): Observable<AuditLog> {
    return this.auditLogs.create(this.auditEntry(cart.id, 'AUDIT_FLAG', 'Flagged for audit', note, new Date().toISOString()));
  }

  acknowledge(alert: Alert): Observable<Alert> {
    return this.alerts.update(alert.id, { status: 'ACKNOWLEDGED' });
  }

  private auditEntry(cartId: string, action: AuditLog['action'], resolution: string, note: string, createdAt: string): Omit<AuditLog, 'id'> {
    return { cartId, action, resolution, note, userId: this.auth.currentUser()?.id ?? 0, createdAt };
  }
}
