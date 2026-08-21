import { Component, computed, effect, ElementRef, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AppNavigation, NavDestination } from './navigation/app-navigation';
import { TranslationService } from './services/translation';

@Component({
  selector: 'app-root',
  imports: [AppNavigation, MatToolbarModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  protected readonly t = inject(TranslationService).t;

  private readonly mainContent = viewChild<ElementRef<HTMLElement>>('mainContent');

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

  private readonly pageTitle = computed(() => {
    const t = this.t();
    const url = this.url();
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
      this.mainContent()?.nativeElement.focus();
    });
  }
}
