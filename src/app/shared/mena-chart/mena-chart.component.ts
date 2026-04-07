import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(
  BarController,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
);

const BAR_COLORS = [
  'rgba(230, 126, 34, 0.85)',
  'rgba(39, 174, 96, 0.85)',
  'rgba(52, 152, 219, 0.85)',
  'rgba(155, 89, 182, 0.85)',
  'rgba(241, 196, 15, 0.85)',
  'rgba(231, 76, 60, 0.85)',
  'rgba(149, 165, 166, 0.85)',
  'rgba(26, 188, 156, 0.85)',
];

const DOUGH_COLORS = [
  '#e67e22',
  '#27ae60',
  '#3498db',
  '#9b59b6',
  '#f1c40f',
  '#e74c3c',
  '#95a5a6',
  '#1abc9c',
  '#34495e',
  '#d35400',
];

@Component({
  selector: 'app-mena-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mena-chart.component.html',
  styleUrl: './mena-chart.component.css',
})
export class MenaChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasEl') canvasRef?: ElementRef<HTMLCanvasElement>;

  @Input() chartTitle = '';
  @Input() chartKind: 'bar' | 'doughnut' = 'bar';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.scheduleRender();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.scheduleRender();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private scheduleRender(): void {
    queueMicrotask(() => this.render());
  }

  private render(): void {
    this.chart?.destroy();
    this.chart = null;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.labels.length || !this.data.length) {
      return;
    }
    const n = Math.min(this.labels.length, this.data.length);
    const labels = this.labels.slice(0, n);
    const data = this.data.slice(0, n);

    const palette =
      this.chartKind === 'doughnut'
        ? labels.map((_, i) => DOUGH_COLORS[i % DOUGH_COLORS.length])
        : labels.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]);

    const cfg = {
      type: this.chartKind,
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: palette,
            borderColor: this.chartKind === 'doughnut' ? '#fff' : palette.map(() => 'rgba(255,255,255,0.4)'),
            borderWidth: this.chartKind === 'doughnut' ? 2 : 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.chartKind === 'doughnut',
            position: 'right' as const,
          },
          tooltip: {
            callbacks: {
              label: (ctx: { raw?: unknown; label?: string; dataset: { data: unknown } }) => {
                const v = ctx.raw as number;
                const sum = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = sum > 0 ? ((v / sum) * 100).toFixed(1) : '0';
                return `${ctx.label ?? ''}: ${v}${this.chartKind === 'doughnut' ? ` (${pct}%)` : ''}`;
              },
            },
          },
        },
        scales:
          this.chartKind === 'bar'
            ? {
                x: { ticks: { maxRotation: 45, minRotation: 0 } },
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0 },
                },
              }
            : {},
      },
    };
    this.chart = new Chart(canvas, cfg as never);
  }
}
