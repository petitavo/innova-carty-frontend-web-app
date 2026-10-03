import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of } from 'rxjs';
import { AuthService } from '../../../../iam/infrastructure/auth.service';
import { poll } from '../../../../shared/infrastructure/polling';
import { LineChart } from '../../../../shared/presentation/components/line-chart/line-chart';
import { cartStatusLabel } from '../../../../shared/presentation/components/status-chip/status-chip';
import { ALERT_ICONS, Alert, SEVERITY_TONES, isOpen } from '../../../domain/model/alert.entity';
import { CART_STATUSES, Cart, CartStatus, isActive } from '../../../domain/model/cart.entity';
import { AlertsApi, CartsApi, SessionStatsApi, StoresApi } from '../../../infrastructure/monitoring-api';

const FLEET_TONES: Record<CartStatus, string> = {
  IN_SESSION: 'ok',
  DISCREPANCY: 'warn',
  LOCKED: 'err',
  PAID: 'info',
  AVAILABLE: 'off',
  OFFLINE: 'off',
};

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, LineChart, MatButtonModule, MatIconModule, MatProgressBarModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly cartsApi = inject(CartsApi);
  private readonly alertsApi = inject(AlertsApi);
  private readonly storesApi = inject(StoresApi);
  private readonly statsApi = inject(SessionStatsApi);

  private readonly data = toSignal(
    poll(() =>
      combineLatest([this.cartsApi.getAll(), this.alertsApi.getAll({ _sort: 'createdAt', _order: 'desc' }), this.storesApi.getAll(), this.statsApi.getAll()]).pipe(
        map(([carts, alerts, stores, stats]) => ({ carts, alerts, store: stores[0] ?? null, stats })),
        catchError(() => of(null)),
      ),
    ),
  );

  protected readonly loading = computed(() => this.data() === undefined);
  protected readonly failed = computed(() => this.data() === null);
  protected readonly carts = computed<Cart[]>(() => this.data()?.carts ?? []);
  protected readonly store = computed(() => this.data()?.store ?? null);
  protected readonly openAlerts = computed<Alert[]>(() => (this.data()?.alerts ?? []).filter(isOpen));
  protected readonly criticalCount = computed(() => this.openAlerts().filter((a) => a.severity === 'CRITICAL').length);
  protected readonly activeCount = computed(() => this.carts().filter(isActive).length);
  protected readonly chart = computed(() => (this.data()?.stats ?? []).map((s) => ({ label: s.hour, value: s.sessions })));
  protected readonly fleet = computed(() =>
    CART_STATUSES.map((status) => ({
      status,
      label: cartStatusLabel(status),
      tone: FLEET_TONES[status],
      count: this.carts().filter((c) => c.status === status).length,
    })),
  );

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Good morning' : hour < 19 ? 'Good afternoon' : 'Good evening';
    return `${part}, ${this.auth.currentUser()?.fullName.split(' ')[0] ?? ''}`;
  });

  protected readonly icons = ALERT_ICONS;
  protected readonly tones = SEVERITY_TONES;
}
