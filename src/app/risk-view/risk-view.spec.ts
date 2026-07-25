import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PatientDataStore } from '../services/patient-data-store';
import { RiskView } from './risk-view';

@Component({ template: '' })
class Blank {}

describe('RiskView', () => {
  let store: PatientDataStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RiskView],
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: '', component: Blank }]),
      ],
    });
    store = TestBed.inject(PatientDataStore);
  });

  it('shows all predicted risks for the normal case', async () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4.0 });
    expect(store.analyze()).toEqual({ ok: true });

    const fixture = TestBed.createComponent(RiskView);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent!;

    expect(text).toContain('Predicted 30-day Amputation/Death');
    expect(text).toContain('1.3%');
    expect(text).toContain('Predicted 30-day MALE');
    expect(text).toContain('3.2%');
    expect(text).toContain('Predicted 2-year OS');
    expect(text).toContain('92%');
    expect(text).toContain('Predicted 2-year AFS');
    expect(text).toContain('88%');
    expect(text).toContain('GNRI');
    expect(text).toContain('101.3');
    expect(text).toContain('Low Risk'); // OS risk class
    expect(text).toContain('No Risk'); // GNRI risk class
  });

  it('redirects to the form when no risk has been calculated', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(RiskView);
    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalled();
  });
});
