import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { GnriRisk, OsRisk } from '../models/patient-risk';
import { PatientDataStore } from '../services/patient-data-store';
import { TranslationService } from '../services/translation';

@Component({
  selector: 'app-risk-view',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './risk-view.html',
  styleUrl: './risk-view.scss',
})
export class RiskView {
  private readonly router = inject(Router);
  protected readonly store = inject(PatientDataStore);
  protected readonly t = inject(TranslationService).t;

  protected readonly risk = this.store.risk;

  protected readonly osRiskLabel = computed(() => {
    const risk = this.risk();
    if (!risk || risk.osRisk === null) return this.t().notAvailable;
    const labels: Record<OsRisk, string> = {
      low: this.t().osLowRisk,
      medium: this.t().osMediumRisk,
      high: this.t().osHighRisk,
    };
    return labels[risk.osRisk];
  });

  protected readonly gnriRiskLabel = computed(() => {
    const risk = this.risk();
    if (!risk || risk.gnriRisk === null) return this.t().notAvailable;
    const labels: Record<GnriRisk, string> = {
      noRisk: this.t().gnriNoRisk,
      low: this.t().gnriLowRisk,
      moderate: this.t().gnriModerateRisk,
      major: this.t().gnriMajorRisk,
    };
    return labels[risk.gnriRisk];
  });

  constructor() {
    if (this.store.risk() === null) {
      void this.router.navigateByUrl('/');
    }
  }

  protected percent(value: number, digits: number): string {
    return `${(value * 100.0).toFixed(digits)}%`;
  }

  protected fixed(value: number, digits: number): string {
    return value.toFixed(digits);
  }

  protected async backToForm(): Promise<void> {
    await this.router.navigateByUrl('/');
  }
}
