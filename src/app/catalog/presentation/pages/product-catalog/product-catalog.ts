import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { StoresApi } from '../../../../monitoring/infrastructure/monitoring-api';
import { PRODUCT_CATEGORIES, Product } from '../../../domain/model/product.entity';
import { ProductsApi } from '../../../infrastructure/products-api';
import { ProductFormDialog, ProductFormDialogData } from '../../components/product-form-dialog/product-form-dialog';

@Component({
  selector: 'app-product-catalog',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './product-catalog.html',
  styleUrl: './product-catalog.css',
})
export class ProductCatalog implements AfterViewInit {
  private readonly api = inject(ProductsApi);
  private readonly storesApi = inject(StoresApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly reload = signal(0);

  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  protected readonly columns = ['id', 'name', 'category', 'rfidPrefix', 'price', 'nominalWeight', 'tolerance', 'edit'];
  protected readonly dataSource = new MatTableDataSource<Product>([]);
  protected readonly categories = PRODUCT_CATEGORIES;

  private readonly data = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() =>
        combineLatest([this.api.getAll(), this.storesApi.getAll()]).pipe(
          map(([products, stores]) => ({ products, fleetSize: stores[0]?.fleetSize ?? 0 })),
          catchError(() => of(null)),
        ),
      ),
    ),
  );
  protected readonly loading = computed(() => this.data() === undefined);
  protected readonly failed = computed(() => this.data() === null);
  protected readonly products = computed(() => this.data()?.products ?? []);
  protected readonly lastSync = computed(() =>
    this.products().reduce<string | null>((latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest), null),
  );

  protected readonly query = signal('');
  protected readonly category = signal<string>('');
  protected readonly highTolerance = signal(false);

  constructor() {
    effect(() => {
      const q = this.query().trim().toLowerCase();
      const cat = this.category();
      const high = this.highTolerance();
      this.dataSource.data = this.products().filter(
        (p) =>
          (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.rfidPrefix.toLowerCase().includes(q)) &&
          (!cat || p.category === cat) &&
          (!high || p.tolerance > 5),
      );
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator() ?? null;
    this.dataSource.sort = this.sort() ?? null;
  }

  protected openForm(product: Product | null): void {
    const data: ProductFormDialogData = {
      product,
      existingIds: this.products().map((p) => p.id),
      fleetSize: this.data()?.fleetSize ?? 0,
    };
    this.dialog
      .open(ProductFormDialog, { data, width: '560px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((saved?: Product) => {
        if (!saved) return;
        this.snackBar.open(`${saved.name} saved and synced to ${data.fleetSize} carts.`, 'OK', { duration: 4000 });
        this.reload.update((n) => n + 1);
      });
  }
}
