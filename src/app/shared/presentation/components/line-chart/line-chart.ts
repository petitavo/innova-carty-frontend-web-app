import { Component, computed, input } from '@angular/core';

export interface ChartPoint {
  label: string;
  value: number;
}

/** Small area chart drawn with SVG (no chart library needed for Sprint 1). */
@Component({
  selector: 'app-line-chart',
  template: `
    <svg [attr.viewBox]="'0 -8 ' + width + ' ' + (height + 36)" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel()">
      @for (g of grid; track g) {
        <line x1="0" [attr.x2]="width" [attr.y1]="g" [attr.y2]="g" stroke="var(--ic-line)" />
      }
      <path [attr.d]="area()" fill="var(--ic-primary-container)" opacity=".7" />
      <path [attr.d]="line()" stroke="var(--ic-primary)" stroke-width="3" fill="none" stroke-linejoin="round" />
      @for (p of labels(); track p.label) {
        <text [attr.x]="p.x" [attr.y]="height + 22" font-size="12" fill="var(--ic-ink-2)" [attr.text-anchor]="p.anchor">{{ p.label }}</text>
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { width: 100%; height: 220px; display: block; overflow: visible; }
  `,
})
export class LineChart {
  readonly points = input.required<ChartPoint[]>();
  readonly ariaLabel = input('Chart');

  protected readonly width = 640;
  protected readonly height = 180;
  protected readonly grid = [0, 60, 120, 180];

  private readonly coords = computed(() => {
    const pts = this.points();
    const max = Math.max(1, ...pts.map((p) => p.value)) * 1.15;
    const step = pts.length > 1 ? this.width / (pts.length - 1) : 0;
    return pts.map((p, i) => ({ x: i * step, y: this.height - (p.value / max) * this.height, label: p.label }));
  });

  protected readonly line = computed(() =>
    this.coords()
      .map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' '),
  );

  protected readonly area = computed(() => `${this.line()} L${this.width},${this.height} L0,${this.height} Z`);

  /** Every other label, so they do not overlap on small screens. */
  protected readonly labels = computed(() => {
    const coords = this.coords();
    return coords
      .filter((_, i) => i % 2 === 0)
      .map((c, i, arr) => ({ ...c, anchor: i === 0 ? 'start' : i === arr.length - 1 && c.x === this.width ? 'end' : 'middle' }));
  });
}
