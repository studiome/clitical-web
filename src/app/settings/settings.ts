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
  protected readonly mobileAppLinks = computed(() => {
    const locale = this.locale();
    const appStoreBadgeLocale = locale === 'ja' ? 'ja-jp' : 'en-us';
    const googlePlayBadgeLocale = locale === 'ja' ? 'ja' : 'en_us';

    return [
      {
        href: 'https://apps.apple.com/app/id1660733252',
        imageSrc: `https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/${appStoreBadgeLocale}?size=250x83`,
        alt: this.t().downloadOnTheAppStore,
      },
      {
        href: 'https://play.google.com/store/apps/details?id=org.studiomexx.clitical_android',
        imageSrc: `https://play.google.com/intl/${googlePlayBadgeLocale}/badges/static/images/badges/${locale}_badge_web_generic.png`,
        alt: this.t().getItOnGooglePlay,
      },
    ];
  });
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
