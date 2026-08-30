import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';
import { PatientDataStore } from './services/patient-data-store';
import { IntendedUseService } from './services/intended-use';
import { TranslationService } from './services/translation';

describe('App', () => {
  const acknowledged = signal(true);

  beforeEach(async () => {
    acknowledged.set(true);
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideNoopAnimations(),
        provideRouter(routes),
        {
          provide: IntendedUseService,
          useValue: {
            isAcknowledged: acknowledged.asReadonly(),
            acknowledge: () => acknowledged.set(true),
          },
        },
      ],
    });
  });

  it('shows only the intended-use notice until it is acknowledged', async () => {
    acknowledged.set(false);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Before you begin');
    expect(root.textContent).toContain('This is not a medical device');
    expect(root.querySelector('mat-toolbar')).toBeNull();
    expect(root.querySelector('app-navigation')).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('Before you begin | CLiTICAL');

    root.querySelector<HTMLButtonElement>('app-intended-use button')!.click();
    await fixture.whenStable();
    expect(root.querySelector('mat-toolbar')?.textContent).toContain('CLiTICAL');
  });

  it('creates the app shell with the CLiTICAL title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')?.textContent).toContain('CLiTICAL');
  });

  it('shows the four navigation destinations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    expect(nav.textContent).toContain('Risk Assessment');
    expect(nav.textContent).toContain('Batch');
    expect(nav.textContent).toContain('References');
    expect(nav.textContent).toContain('Settings');
  });

  it('has no overflow menu button in the toolbar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar.querySelector('button')).toBeNull();
  });

  it('uses the app toolbar on ordinary routes and an About toolbar with a back link', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.app-toolbar .app-title')?.textContent).toContain('CLiTICAL');
    expect(root.querySelector('.about-toolbar')).toBeNull();

    await router.navigateByUrl('/settings/about');
    await fixture.whenStable();
    const aboutToolbar = root.querySelector('.about-toolbar');
    expect(aboutToolbar).not.toBeNull();
    const backLink = aboutToolbar?.querySelector<HTMLAnchorElement>('a.about-back');
    expect(backLink?.getAttribute('href')).toBe('/settings');
    expect(backLink?.hasAttribute('mat-icon-button')).toBe(true);
    expect(backLink?.getAttribute('aria-label')).toBe('Back to Settings');
    expect(aboutToolbar?.querySelector('mat-icon')?.textContent).toContain('arrow_back');
    expect(aboutToolbar?.textContent).toContain('About');
    expect(root.querySelector('.app-toolbar')).toBeNull();

    TestBed.inject(TranslationService).setLocale('ja');
    fixture.detectChanges();
    expect(aboutToolbar?.getAttribute('aria-label')).toBeNull();
    expect(aboutToolbar?.querySelector('.about-back')?.getAttribute('aria-label')).toBe(
      '設定に戻る',
    );
    expect(aboutToolbar?.textContent).toContain('このアプリについて');
    TestBed.inject(TranslationService).setLocale('en');
  });

  it('shows the question form on the home route', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await TestBed.inject(Router).navigate(['']);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Rutherford Classification',
    );
  });

  it('navigates to the References destination and marks it active', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/references');
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('Tap to open link.');

    const current = fixture.nativeElement.querySelector('nav a[aria-current="page"]');
    expect(current?.textContent).toContain('References');
  });

  it('navigates to Batch Processing and marks it active', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/batch');
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('Download the Excel template');
    const current = fixture.nativeElement.querySelector('nav a[aria-current="page"]');
    expect(current?.textContent).toContain('Batch');
  });

  it('navigates to the Settings destination and marks it active', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/settings');
    await fixture.whenStable();

    const current = fixture.nativeElement.querySelector('nav a[aria-current="page"]');
    expect(current?.textContent).toContain('Settings');
  });

  it('keeps Risk active on the result route', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/result');
    await fixture.whenStable();

    const current = fixture.nativeElement.querySelector('nav a[aria-current="page"]');
    expect(current?.textContent).toContain('Risk Assessment');
  });

  it('orders the shell as skip link, header, main, then navigation for correct focus order', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const tags = [...root.children].map((el) => el.tagName.toLowerCase());
    expect(tags).toEqual(['a', 'header', 'main', 'app-navigation']);
  });

  it('wraps the toolbar in a header landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const header: HTMLElement = fixture.nativeElement.querySelector('header');
    expect(header.querySelector('mat-toolbar')).not.toBeNull();
  });

  it('renders the app title as a span so each page keeps a single h1', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar.querySelector('h1')).toBeNull();
    expect(toolbar.querySelector('span.app-title')?.textContent).toContain('CLiTICAL');
  });

  it('provides a skip link that points at the focusable main content', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const skipLink: HTMLAnchorElement | null = root.querySelector('a.skip-link');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
    expect(skipLink?.textContent).toContain('Skip to main content');

    const main = root.querySelector('main');
    expect(main?.id).toBe('main-content');
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('sets a localized document title for the current route', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const titleService = TestBed.inject(Title);
    expect(titleService.getTitle()).toBe('Patient Data | CLiTICAL');

    await TestBed.inject(Router).navigateByUrl('/batch');
    await fixture.whenStable();
    expect(titleService.getTitle()).toBe('Batch Processing | CLiTICAL');

    await TestBed.inject(Router).navigateByUrl('/references');
    await fixture.whenStable();
    expect(titleService.getTitle()).toBe('References | CLiTICAL');

    await TestBed.inject(Router).navigateByUrl('/settings');
    await fixture.whenStable();
    expect(titleService.getTitle()).toBe('Settings | CLiTICAL');

    await TestBed.inject(Router).navigateByUrl('/settings/about');
    await fixture.whenStable();
    expect(titleService.getTitle()).toBe('About | CLiTICAL');

    // RiskView redirects back to '/' when there is no calculated risk, so
    // give the store something to show before navigating there.
    const store = TestBed.inject(PatientDataStore);
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4 });
    store.analyze();
    await TestBed.inject(Router).navigateByUrl('/result');
    await fixture.whenStable();
    expect(titleService.getTitle()).toBe('Predicted Risks | CLiTICAL');
  });

  it('moves focus to the main content on route change, but not on initial load', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const main: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(document.activeElement).not.toBe(main);

    await TestBed.inject(Router).navigateByUrl('/references');
    await fixture.whenStable();
    const heading = main.querySelector('h1');
    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
  });
});
