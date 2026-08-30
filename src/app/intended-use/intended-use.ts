import { afterNextRender, Component, computed, inject, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { IntendedUseService } from '../services/intended-use';
import { MessageKey } from '../services/messages';
import { TranslationService } from '../services/translation';

interface NoticePoint {
  title: MessageKey;
  body: MessageKey;
  icon: string;
}

@Component({
  selector: 'app-intended-use',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './intended-use.html',
  styleUrl: './intended-use.scss',
})
export class IntendedUse {
  private readonly translation = inject(TranslationService);
  private readonly intendedUse = inject(IntendedUseService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  protected readonly t = this.translation.t;
  protected readonly termsUrl = computed(
    () => `https://studiome.github.io/clitical-legal/terms/${this.translation.locale()}/`,
  );

  protected readonly points: NoticePoint[] = [
    {
      title: 'disclaimerIntendedUser',
      body: 'disclaimerIntendedUserBody',
      icon: 'medical_services',
    },
    {
      title: 'disclaimerNotADevice',
      body: 'disclaimerNotADeviceBody',
      icon: 'health_and_safety',
    },
    {
      title: 'disclaimerValues',
      body: 'disclaimerValuesBody',
      icon: 'functions',
    },
    {
      title: 'disclaimerPopulation',
      body: 'disclaimerPopulationBody',
      icon: 'bar_chart',
    },
    {
      title: 'disclaimerResponsibility',
      body: 'disclaimerResponsibilityBody',
      icon: 'person',
    },
  ];

  protected acknowledge(): void {
    this.intendedUse.acknowledge();
    // The router may have performed initial navigation before this conditional
    // outlet existed. Re-navigate once the shell is rendered so deep links
    // (including /settings/about) activate their component normally.
    afterNextRender(
      () => void this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' }),
      { injector: this.injector },
    );
  }
}
