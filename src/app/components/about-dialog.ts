import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { TranslationService } from '../services/translation';

export const APP_VERSION = '1.0.0';

@Component({
  selector: 'app-about-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ t().appName }}</h2>
    <mat-dialog-content>
      <p class="version">{{ version }}</p>
      <p>{{ t().appLegalese }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ t().ok }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .version {
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class AboutDialog {
  protected readonly t = inject(TranslationService).t;
  protected readonly version = APP_VERSION;
}
