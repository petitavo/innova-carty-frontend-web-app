import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <section class="page not-found">
      <mat-icon>travel_explore</mat-icon>
      <h2>Page not found</h2>
      <p class="muted">The page you are looking for does not exist or was moved.</p>
      <a mat-flat-button routerLink="/dashboard"><mat-icon>dashboard</mat-icon> Back to dashboard</a>
    </section>
  `,
  styles: `
    .not-found { align-items: center; text-align: center; padding-top: 96px; }
    .not-found > mat-icon { width: 64px; height: 64px; font-size: 64px; color: var(--ic-primary); }
  `,
})
export class PageNotFound {}
