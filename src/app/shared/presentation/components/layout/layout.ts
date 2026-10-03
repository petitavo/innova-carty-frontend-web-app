import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { initials } from '../../../../iam/domain/model/user.entity';
import { AuthService } from '../../../../iam/infrastructure/auth.service';
import { isOpen } from '../../../../monitoring/domain/model/alert.entity';
import { AlertsApi, StoresApi } from '../../../../monitoring/infrastructure/monitoring-api';
import { poll } from '../../../infrastructure/polling';

interface NavItem {
  icon: string;
  label: string;
  link: string;
}

@Component({
  selector: 'app-layout',
  imports: [
    FormsModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertsApi = inject(AlertsApi);
  private readonly storesApi = inject(StoresApi);

  protected readonly user = this.auth.currentUser;
  protected readonly userInitials = computed(() => initials(this.user()?.fullName ?? ''));
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly nav: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', link: '/dashboard' },
    { icon: 'shopping_cart', label: 'Carts', link: '/carts' },
    { icon: 'notifications_active', label: 'Alerts', link: '/alerts' },
    { icon: 'inventory_2', label: 'Catalog', link: '/catalog' },
  ];

  protected readonly openAlerts = toSignal(
    poll(() => this.alertsApi.getAll().pipe(catchError(() => of([])))).pipe(map((alerts) => alerts.filter(isOpen).length)),
    { initialValue: 0 },
  );

  protected readonly store = toSignal(
    this.storesApi.getAll().pipe(
      map((stores) => stores.find((s) => s.id === this.user()?.storeId) ?? null),
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );

  protected readonly search = signal('');

  protected submitSearch(): void {
    const q = this.search().trim();
    this.router.navigate(['/carts'], { queryParams: q ? { q } : {} });
  }

  protected signOut(): void {
    this.auth.signOut();
  }
}
