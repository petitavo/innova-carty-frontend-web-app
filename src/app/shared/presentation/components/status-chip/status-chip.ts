import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CartStatus } from '../../../../monitoring/domain/model/cart.entity';

const STATUS_VIEW: Record<CartStatus, { label: string; icon: string; tone: string }> = {
  IN_SESSION: { label: 'In session', icon: 'shopping_cart', tone: 'ok' },
  DISCREPANCY: { label: 'Discrepancy', icon: 'scale', tone: 'warn' },
  LOCKED: { label: 'Locked', icon: 'lock', tone: 'err' },
  PAID: { label: 'Paid · clearance', icon: 'verified', tone: 'info' },
  OFFLINE: { label: 'Offline', icon: 'wifi_off', tone: 'off' },
  AVAILABLE: { label: 'Available', icon: 'check', tone: 'off' },
};

export function cartStatusLabel(status: CartStatus): string {
  return STATUS_VIEW[status].label;
}

@Component({
  selector: 'app-status-chip',
  imports: [MatIconModule],
  template: `<span class="chip {{ view().tone }}"><mat-icon>{{ view().icon }}</mat-icon>{{ view().label }}</span>`,
})
export class StatusChip {
  readonly status = input.required<CartStatus>();
  protected readonly view = computed(() => STATUS_VIEW[this.status()]);
}
