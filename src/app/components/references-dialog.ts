import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { TranslationService } from '../services/translation';

@Component({
  selector: 'app-references-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ t().references }}</h2>
    <mat-dialog-content>
      <p>{{ t().tapToOpenLink }}</p>
      <ol class="reference-list">
        <li>
          <a href="https://doi.org/10.1093/bjs/znab036" target="_blank" rel="noopener">
            Miyata T. et al, Risk prediction model for early outcomes of
            revascularization for chronic limb-threatening ischaemia. Br J Surg.
            2022 Oct 14;109(11):1123.
          </a>
        </li>
        <li>
          <a
            href="https://doi.org/10.1016/j.ejvs.2022.05.038"
            target="_blank"
            rel="noopener"
          >
            Miyata T. et al, Prediction Models for Two Year Overall Survival and
            Amputation Free Survival After Revascularisation for Chronic Limb
            Threatening Ischaemia. Eur J Vasc Endovasc Surg. 2022 Jun
            7;S1078-5884(22)00340-9.
          </a>
        </li>
      </ol>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ t().ok }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .reference-list li {
      margin-bottom: 12px;
    }

    a {
      color: var(--mat-sys-primary);
    }
  `,
})
export class ReferencesDialog {
  protected readonly t = inject(TranslationService).t;
}
