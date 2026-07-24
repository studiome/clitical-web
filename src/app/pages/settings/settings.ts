import { Component, inject } from '@angular/core';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';

import { APP_VERSION } from '../../app-version';
import { AppLocale } from '../../services/messages';
import { TranslationService } from '../../services/translation';

@Component({
  selector: 'app-settings',
  imports: [MatRadioModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly translation = inject(TranslationService);
  protected readonly t = this.translation.t;
  protected readonly locale = this.translation.locale;
  protected readonly version = APP_VERSION;
  protected readonly termsUrl = 'https://studiome.github.io/clti_risk/';

  protected onLocaleChange(event: MatRadioChange<AppLocale>): void {
    this.translation.setLocale(event.value);
  }
}
