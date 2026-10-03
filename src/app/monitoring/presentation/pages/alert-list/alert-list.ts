import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { poll } from '../../../../shared/infrastructure/polling';
import { CartSupervisionService } from '../../../application/cart-supervision.service';
import { ALERT_ICONS, Alert, AlertType, SEVERITY_TONES, isOpen } from '../../../domain/model/alert.entity';
import { AlertsApi } from '../../../infrastructure/monitoring-api';

interface AlertTab {
  label: string;
  matches: (alert: Alert) => boolean;
}

const byType = (type: AlertType) => (a: Alert) => isOpen(a) && a.type === type;

const CTA: Record<AlertType, string> = { GEOFENCE: 'Go to exit', WEIGHT: 'Open cart', RFID: 'Open cart', DEVICE: 'Locate' };

@Component({
  selector: 'app-alert-list',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, MatTabsModule, RouterLink],
  templateUrl: './alert-list.html',
  styleUrl: './alert-list.css',
})
export class AlertList {
  private readonly api = inject(AlertsApi);
  private readonly supervision = inject(CartSupervisionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly reload = signal(0);

  private readonly alerts = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() => poll(() => this.api.getAll({ _sort: 'createdAt', _order: 'desc' }).pipe(catchError(() => of(null))))),
    ),
  );

  protected readonly loading = computed(() => this.alerts() === undefined);
  protected readonly failed = computed(() => this.alerts() === null);

  protected readonly tabs: AlertTab[] = [
    { label: 'Open', matches: isOpen },
    { label: 'Geofence', matches: byType('GEOFENCE') },
    { label: 'Weight', matches: byType('WEIGHT') },
    { label: 'RFID', matches: byType('RFID') },
    { label: 'Devices', matches: byType('DEVICE') },
    { label: 'Resolved', matches: (a) => a.status === 'RESOLVED' },
  ];
  protected readonly selected = signal(0);
  protected readonly counts = computed(() => this.tabs.map((t) => (this.alerts() ?? []).filter(t.matches).length));
  protected readonly visible = computed(() => (this.alerts() ?? []).filter(this.tabs[this.selected()].matches));

  protected readonly icons = ALERT_ICONS;
  protected readonly tones = SEVERITY_TONES;
  protected readonly cta = CTA;

  protected acknowledge(alert: Alert): void {
    this.supervision.acknowledge(alert).subscribe({
      next: () => {
        this.snackBar.open(`Alert on ${alert.cartId} acknowledged.`, 'OK', { duration: 3000 });
        this.reload.update((n) => n + 1);
      },
      error: () => this.snackBar.open('The alert could not be updated.', 'OK', { duration: 3000 }),
    });
  }
}
