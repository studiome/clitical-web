import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';
import { PatientDataStore } from './services/patient-data-store';
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

  it('switches language from the toolbar menu', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const langButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.language-button');
    langButton.click();
    await fixture.whenStable();
    const jaOption = [...document.querySelectorAll<HTMLElement>('[mat-menu-item]')].find(
      (el) => el.textContent?.includes('日本語'),
    );
    expect(jaOption).toBeTruthy();
    jaOption!.click();
    await fixture.whenStable();
    expect(TestBed.inject(TranslationService).locale()).toBe('ja');
  });

  it('resets patient data from the toolbar', async () => {
    const store = TestBed.inject(PatientDataStore);
    store.setField('sex', 'male');
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4 });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const resetButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.reset-button');
    resetButton.click();
    await fixture.whenStable();
    expect(store.data().sex).toBe('female');
    expect(store.numbers().age).toBeNull();
  });
});
