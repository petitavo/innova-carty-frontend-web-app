import { CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { poll } from '../../../../shared/infrastructure/polling';
import { StatusChip, cartStatusLabel } from '../../../../shared/presentation/components/status-chip/status-chip';
import { CART_STATUSES, Cart, CartStatus, needsAttention } from '../../../domain/model/cart.entity';
import { CartsApi } from '../../../infrastructure/monitoring-api';

type Filter = CartStatus | 'ALL';

@Component({
  selector: 'app-cart-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    StatusChip,
  ],
  templateUrl: './cart-list.html',
  styleUrl: './cart-list.css',
})
export class CartList implements AfterViewInit {
  private readonly api = inject(CartsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly columns = ['id', 'status', 'itemsCount', 'total', 'budget', 'zone', 'lastEvent', 'battery', 'open'];
  protected readonly dataSource = new MatTableDataSource<Cart>([]);
  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  private readonly carts = toSignal(poll(() => this.api.getAll().pipe(catchError(() => of(null)))));
  protected readonly loading = computed(() => this.carts() === undefined);
  protected readonly failed = computed(() => this.carts() === null);

  protected readonly filter = signal<Filter>((this.route.snapshot.queryParamMap.get('status') as Filter) || 'ALL');
  protected readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  protected readonly filters = computed(() => {
    const all = this.carts() ?? [];
    return [
      { value: 'ALL' as Filter, label: 'All', count: all.length },
      ...CART_STATUSES.map((s) => ({ value: s as Filter, label: cartStatusLabel(s), count: all.filter((c) => c.status === s).length })),
    ];
  });

  protected readonly needsAttention = needsAttention;

  constructor() {
    // Keep the table in sync with the live data, the status chip and the search box.
    effect(() => {
      const q = this.query().trim().toLowerCase();
      const f = this.filter();
      this.dataSource.data = (this.carts() ?? []).filter(
        (c) => (f === 'ALL' || c.status === f) && (!q || c.id.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q) || (c.sessionId ?? '').toLowerCase().includes(q)),
      );
    });
    // The search box in the top bar navigates here with ?q=
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (params.has('q')) this.query.set(params.get('q') ?? '');
      if (params.has('status')) this.filter.set(params.get('status') as Filter);
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator() ?? null;
    this.dataSource.sort = this.sort() ?? null;
    // Problems first, then most recent activity.
    this.dataSource.sortData = (data, sort) => {
      if (!sort.active || !sort.direction) {
        return [...data].sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)) || b.lastEventAt.localeCompare(a.lastEventAt));
      }
      const dir = sort.direction === 'asc' ? 1 : -1;
      return [...data].sort((a, b) => {
        const x = a[sort.active as keyof Cart] ?? '';
        const y = b[sort.active as keyof Cart] ?? '';
        return (x < y ? -1 : x > y ? 1 : 0) * dir;
      });
    };
  }

  protected setFilter(value: Filter): void {
    this.filter.set(value);
    this.paginator()?.firstPage();
  }

  protected open(cart: Cart): void {
    this.router.navigate(['/carts', cart.id]);
  }
}
