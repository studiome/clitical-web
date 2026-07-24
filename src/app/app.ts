import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AppNavigation, NavDestination } from './components/app-navigation';
import { TranslationService } from './services/translation';

@Component({
  selector: 'app-root',
  imports: [AppNavigation, MatToolbarModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly t = inject(TranslationService).t;

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
    if (url.startsWith('/references')) return 'references';
    if (url.startsWith('/settings')) return 'settings';
    return 'risk';
  });
}
