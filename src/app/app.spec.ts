import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideNoopAnimations(), provideRouter(routes)],
    });
  });

  it('creates the app shell with the CLiTICAL title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')?.textContent).toContain('CLiTICAL');
  });

  it('shows the three navigation destinations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    expect(nav.textContent).toContain('Risk Assessment');
    expect(nav.textContent).toContain('References');
    expect(nav.textContent).toContain('Settings');
  });

  it('has no overflow menu button in the toolbar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar.querySelector('button')).toBeNull();
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
});
