import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { PRODUCT_CATEGORIES, Product, allowedRange } from '../../../domain/model/product.entity';
import { ProductsApi } from '../../../infrastructure/products-api';

export interface ProductFormDialogData {
  product: Product | null;
  existingIds: string[];
  fleetSize: number;
}

@Component({
  selector: 'app-product-form-dialog',
  imports: [DecimalPipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './product-form-dialog.html',
  styleUrl: './product-form-dialog.css',
})
export class ProductFormDialog {
  protected readonly data = inject<ProductFormDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<ProductFormDialog, Product>>(MatDialogRef);
  private readonly api = inject(ProductsApi);

  protected readonly isNew = this.data.product === null;
  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    id: [{ value: this.data.product?.id ?? '', disabled: !this.isNew }, [Validators.required, Validators.pattern(/^SKU-\d{5}$/)]],
    name: [this.data.product?.name ?? '', [Validators.required, Validators.maxLength(60)]],
    category: [this.data.product?.category ?? 'Grocery', Validators.required],
    rfidPrefix: [this.data.product?.rfidPrefix ?? '', [Validators.required, Validators.pattern(/^E200( \d{4}){2}$/)]],
    price: [this.data.product?.price ?? 0, [Validators.required, Validators.min(0.1)]],
    nominalWeight: [this.data.product?.nominalWeight ?? 0, [Validators.required, Validators.min(1)]],
    tolerance: [this.data.product?.tolerance ?? 3, [Validators.required, Validators.min(1), Validators.max(15)]],
  });

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly range = computed(() => {
    const v = this.values();
    return allowedRange(Number(v.nominalWeight) || 0, Number(v.tolerance) || 0);
  });

  protected save(): void {
    const id = this.form.getRawValue().id.trim().toUpperCase();
    if (this.isNew && this.data.existingIds.includes(id)) {
      this.form.controls.id.setErrors({ duplicate: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const product: Product = {
      id,
      name: v.name.trim(),
      category: v.category,
      rfidPrefix: v.rfidPrefix.trim(),
      price: Number(v.price),
      nominalWeight: Number(v.nominalWeight),
      tolerance: Number(v.tolerance),
      icon: this.data.product?.icon ?? 'inventory_2',
      updatedAt: new Date().toISOString(),
    };
    const request: Observable<Product> = this.isNew ? this.api.create(product) : this.api.update(product.id, product);
    this.saving.set(true);
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: () => {
        this.saving.set(false);
        this.error.set('The product could not be saved. Try again.');
      },
    });
  }
}
