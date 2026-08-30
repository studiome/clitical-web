import { Component, computed, inject } from '@angular/core';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { RouterLink } from '@angular/router';

import { APP_VERSION } from '../app-version';
import { AppLocale } from '../services/messages';
import { TranslationService } from '../services/translation';

@Component({
  selector: 'app-settings',
  imports: [MatRadioModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly translation = inject(TranslationService);
  protected readonly t = this.translation.t;
  protected readonly locale = this.translation.locale;
  protected readonly version = APP_VERSION;
  protected readonly legalLinks = computed(() => {
    const locale = this.locale();
    const baseUrl = 'https://studiome.github.io/clitical-legal';

    return [
      {
        label: this.t().termsOfService,
        href: `${baseUrl}/terms/${locale}/`,
      },
      {
        label: this.t().privacyPolicy,
        href: `${baseUrl}/privacy/${locale}/`,
      },
      {
        label: this.t().support,
        href: `${baseUrl}/support/${locale}/`,
      },
    ];
  });

  protected onLocaleChange(event: MatRadioChange<AppLocale>): void {
    this.translation.setLocale(event.value);
  }
}
