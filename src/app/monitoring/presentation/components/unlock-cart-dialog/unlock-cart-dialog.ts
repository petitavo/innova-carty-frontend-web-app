import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CartSupervisionService, UnlockCartCommand } from '../../../application/cart-supervision.service';
import { Cart } from '../../../domain/model/cart.entity';

export type UnlockCartDialogData = Omit<UnlockCartCommand, 'resolution' | 'pin' | 'note'>;

export const RESOLUTIONS = [
  'Item placed again and read correctly',
  'Unregistered item removed from the cart',
  'Personal item (not store merchandise)',
  'Shopper paid at assisted checkout',
  'False alarm, sensor recalibrated',
];

@Component({
  selector: 'app-unlock-cart-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="row"><mat-icon>lock_open</mat-icon> Unlock {{ data.cart.id }}</h2>
    <form mat-dialog-content [formGroup]="form" id="unlock-form" (ngSubmit)="confirm()" class="form">
      <p class="muted">Confirm you checked the cart in person. The resolution is saved in the audit log.</p>
      <mat-form-field appearance="outline">
        <mat-label>Resolution</mat-label>
        <mat-select formControlName="resolution">
          @for (r of resolutions; track r) {
            <mat-option [value]="r">{{ r }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Supervisor PIN</mat-label>
        <input matInput type="password" inputmode="numeric" maxlength="4" formControlName="pin" autocomplete="off" />
        @if (form.controls.pin.hasError('pattern') || form.controls.pin.hasError('required')) {
          <mat-error>Enter your 4-digit PIN</mat-error>
        }
        @if (form.controls.pin.hasError('wrong')) {
          <mat-error>Incorrect PIN</mat-error>
        }
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Note (optional)</mat-label>
        <textarea matInput rows="2" formControlName="note" placeholder="Add a comment for the audit log"></textarea>
      </mat-form-field>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
    </form>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button type="submit" form="unlock-form" [disabled]="saving()">Unlock cart</button>
    </div>
  `,
  styles: `
    .form { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; }
    .form > p { margin-bottom: 12px; font-size: 14px; }
    .error { color: #b3261e; font-size: 14px; }
  `,
})
export class UnlockCartDialog {
  protected readonly data = inject<UnlockCartDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<UnlockCartDialog, Cart>>(MatDialogRef);
  private readonly supervision = inject(CartSupervisionService);

  protected readonly resolutions = RESOLUTIONS;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    resolution: [RESOLUTIONS[0], Validators.required],
    pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    note: [''],
  });

  protected confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.supervision.unlock({ ...this.data, ...this.form.getRawValue() }).subscribe({
      next: (cart) => this.ref.close(cart),
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        if (err.status === 403) {
          this.form.controls.pin.setErrors({ wrong: true });
        } else {
          this.error.set('The cart could not be unlocked. Try again.');
        }
      },
    });
  }
}
