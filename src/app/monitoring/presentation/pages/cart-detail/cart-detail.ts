import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { poll } from '../../../../shared/infrastructure/polling';
import { StatusChip } from '../../../../shared/presentation/components/status-chip/status-chip';
import { CartSupervisionService } from '../../../application/cart-supervision.service';
import { Alert, isOpen } from '../../../domain/model/alert.entity';
import { CartEvent } from '../../../domain/model/cart-event.entity';
import { Cart, needsAttention } from '../../../domain/model/cart.entity';
import { ShoppingSession, isWeightWithinTolerance, weightDifference } from '../../../domain/model/shopping-session.entity';
import { AlertsApi, CartEventsApi, CartsApi, ShoppingSessionsApi } from '../../../infrastructure/monitoring-api';
import { UnlockCartDialog, UnlockCartDialogData } from '../../components/unlock-cart-dialog/unlock-cart-dialog';

interface CartDetailView {
  cart: Cart;
  session: ShoppingSession | null;
  events: CartEvent[];
  alerts: Alert[];
}

const TONE_CHIP: Record<string, string> = { OK: 'ok', INFO: 'info', WARNING: 'warn', CRITICAL: 'err' };
const EVENT_ICONS: Record<string, string> = {
  WEIGHT: 'scale',
  ITEM_ADDED: 'add',
  ITEM_REMOVED: 'remove',
  BUDGET: 'savings',
  SESSION: 'link',
  GEOFENCE: 'fence',
  PAYMENT: 'qr_code_2',
  UNLOCK: 'lock_open',
};

@Component({
  selector: 'app-cart-detail',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, RouterLink, StatusChip],
  templateUrl: './cart-detail.html',
  styleUrl: './cart-detail.css',
})
export class CartDetail {
  /** Route parameter :id (bound with withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly cartsApi = inject(CartsApi);
  private readonly sessionsApi = inject(ShoppingSessionsApi);
  private readonly eventsApi = inject(CartEventsApi);
  private readonly alertsApi = inject(AlertsApi);
  private readonly supervision = inject(CartSupervisionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly refresh = signal(0);

  private readonly view = toSignal(
    combineLatest([toObservable(this.id), toObservable(this.refresh)]).pipe(
      switchMap(([id]) =>
        poll(() =>
          this.cartsApi.getById(id).pipe(
            switchMap((cart) =>
              combineLatest([
                cart.sessionId ? this.sessionsApi.getById(cart.sessionId).pipe(catchError(() => of(null))) : of(null),
                this.eventsApi.getAll({ cartId: cart.id, _sort: 'occurredAt', _order: 'desc' }),
                this.alertsApi.getAll({ cartId: cart.id }),
              ]).pipe(map(([session, events, alerts]) => ({ cart, session, events, alerts }) as CartDetailView)),
            ),
            catchError(() => of(null)),
          ),
        ).pipe(startWith(undefined)),
      ),
    ),
  );

  protected readonly loading = computed(() => this.view() === undefined);
  protected readonly notFound = computed(() => this.view() === null);
  protected readonly cart = computed(() => this.view()?.cart ?? null);
  protected readonly session = computed(() => this.view()?.session ?? null);
  protected readonly events = computed(() => this.view()?.events ?? []);
  protected readonly openAlerts = computed(() => (this.view()?.alerts ?? []).filter(isOpen));
  protected readonly geofenceAlert = computed(() => this.openAlerts().find((a) => a.type === 'GEOFENCE') ?? null);
  protected readonly difference = computed(() => (this.session() ? weightDifference(this.session()!) : 0));
  protected readonly weightOk = computed(() => (this.session() ? isWeightWithinTolerance(this.session()!) : true));
  protected readonly canUnlock = computed(() => !!this.cart() && needsAttention(this.cart()!));
  protected readonly budgetPct = computed(() => {
    const s = this.session();
    return s && s.budget ? Math.round((s.total / s.budget) * 100) : null;
  });

  protected readonly toneChip = TONE_CHIP;
  protected readonly eventIcons = EVENT_ICONS;

  protected unlock(): void {
    const cart = this.cart();
    if (!cart) return;
    const data: UnlockCartDialogData = { cart, session: this.session(), openAlerts: this.openAlerts() };
    this.dialog
      .open(UnlockCartDialog, { data, width: '480px', maxWidth: '95vw', autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((updated?: Cart) => {
        if (!updated) return;
        this.snackBar.open(`${updated.id} unlocked. The shopper can continue.`, 'OK', { duration: 4000 });
        this.refresh.update((n) => n + 1);
      });
  }

  protected flag(): void {
    const cart = this.cart();
    if (!cart) return;
    this.supervision.flagForAudit(cart, cart.lastEvent).subscribe({
      next: () => this.snackBar.open(`${cart.id} flagged for audit.`, 'OK', { duration: 3000 }),
      error: () => this.snackBar.open('The audit flag could not be saved.', 'OK', { duration: 3000 }),
    });
  }
}
