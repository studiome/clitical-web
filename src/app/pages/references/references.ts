import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation';

interface Citation {
  text: string;
  url: string;
}

@Component({
  selector: 'app-references',
  template: `
    <h1 class="page-title">{{ t().references }}</h1>
    <p class="hint">{{ t().tapToOpenLink }}</p>
    <ul class="citation-list">
      @for (citation of citations; track citation.url) {
        <li>
          <a
            class="citation"
            [href]="citation.url"
            target="_blank"
            rel="noopener"
          >
            <span class="citation-text">{{ citation.text }}</span>
            <span class="material-icons open-icon" aria-hidden="true">open_in_new</span>
          </a>
        </li>
      }
    </ul>
  `,
  styleUrl: './references.scss',
})
export class References {
  protected readonly t = inject(TranslationService).t;

  protected readonly citations: Citation[] = [
    {
      text: '1. Miyata T. et al, Risk prediction model for early outcomes of revascularization for chronic limb-threatening ischaemia. Br J Surg. 2022 Oct 14;109(11):1123.',
      url: 'https://doi.org/10.1093/bjs/znab036',
    },
    {
      text: '2. Miyata T. et al, Prediction Models for Two Year Overall Survival and Amputation Free Survival After Revascularisation for Chronic Limb Threatening Ischaemia. Eur J Vasc Endovasc Surg. 2022 Jun 7;S1078-5884(22)00340-9.',
      url: 'https://doi.org/10.1016/j.ejvs.2022.05.038',
    },
  ];
}
