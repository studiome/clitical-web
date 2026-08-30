import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AppNavigation, NavDestination } from './navigation/app-navigation';
import { IntendedUse } from './intended-use/intended-use';
import { IntendedUseService } from './services/intended-use';
import { TranslationService } from './services/translation';

@Component({
  selector: 'app-root',
  imports: [
    AppNavigation,
    IntendedUse,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  protected readonly t = inject(TranslationService).t;
  protected readonly intendedUseAcknowledged = inject(IntendedUseService).isAcknowledged;

  private readonly mainContent = viewChild<ElementRef<HTMLElement>>('mainContent');
  private readonly injector = inject(Injector);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly destinations = computed<NavDestination[]>(() => [
    { id: 'risk', label: this.t().riskAssessmentTab, icon: 'analytics', link: '/' },
    {
      id: 'batch',
      label: this.t().batchProcessingTab,
      icon: 'table_view',
      link: '/batch',
    },
    {
      id: 'references',
      label: this.t().references,
      icon: 'menu_book',
      link: '/references',
    },
    { id: 'settings', label: this.t().settings, icon: 'settings', link: '/settings' },
  ]);

  // The result screen is part of the risk flow, so keep Risk highlighted there.
  protected readonly activeId = computed(() => {
    const url = this.url();
    if (url.startsWith('/batch')) return 'batch';
    if (url.startsWith('/references')) return 'references';
    if (url.startsWith('/settings')) return 'settings';
    return 'risk';
  });

  protected readonly isAbout = computed(() => this.url().startsWith('/settings/about'));

  private readonly pageTitle = computed(() => {
    const t = this.t();
    if (!this.intendedUseAcknowledged()) return t.disclaimerTitle;
    const url = this.url();
    if (url.startsWith('/settings/about')) return t.about;
    if (url.startsWith('/batch')) return t.batchProcessingTitle;
    if (url.startsWith('/references')) return t.references;
    if (url.startsWith('/settings')) return t.settings;
    if (url.startsWith('/result')) return t.result;
    return t.questionFormTitle;
  });

  constructor() {
    effect(() => {
      this.titleService.setTitle(`${this.pageTitle()} | ${this.t().appName}`);
    });

    // Skip the first run: on initial page load focus should stay wherever
    // the browser puts it, not get stolen away to <main>.
    let isFirstNavigation = true;
    effect(() => {
      this.url();
      if (isFirstNavigation) {
        isFirstNavigation = false;
        return;
      }
      afterNextRender(
        () => {
          const main = this.mainContent()?.nativeElement;
          const heading = main?.querySelector<HTMLElement>('h1');
          if (heading) {
            // Route headings are made programmatically focusable in one place
            // so lazy-loaded pages follow the same announcement pattern.
            heading.tabIndex = -1;
            heading.focus();
          }
        },
        { injector: this.injector },
      );
    });
  }
}
