import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';
import { TranslationService } from './services/translation';

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

  it('shows the question form on the home route', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await TestBed.inject(Router).navigate(['']);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Rutherford Classification',
    );
  });

  it('has no reset button in the toolbar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar.querySelector('.reset-button')).toBeNull();
  });

  it('switches language from the language item in the overflow menu', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const menuButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.menu-button');
    menuButton.click();
    await fixture.whenStable();

    const languageItem = [
      ...document.querySelectorAll<HTMLElement>('[mat-menu-item]'),
    ].find((el) => el.textContent?.includes('Language'));
    expect(languageItem).toBeTruthy();
    languageItem!.click();
    await fixture.whenStable();

    const jaOption = [...document.querySelectorAll<HTMLElement>('[mat-menu-item]')].find(
      (el) => el.textContent?.includes('日本語'),
    );
    expect(jaOption).toBeTruthy();
    jaOption!.click();
    await fixture.whenStable();
    expect(TestBed.inject(TranslationService).locale()).toBe('ja');
  });
});
