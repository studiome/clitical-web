import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';
import { QuestionForm } from './question-form/question-form';
import { References } from './references/references';
import { RiskView } from './risk-view/risk-view';
import { Settings } from './settings/settings';
import { PatientDataStore } from './services/patient-data-store';

// colour-contrast needs a real layout engine, so it cannot run under jsdom;
// contrast is covered by using Material system colour tokens only
const AXE_OPTIONS: axe.RunOptions = {
  rules: { 'color-contrast': { enabled: false } },
};

async function expectNoViolations(element: HTMLElement): Promise<void> {
  const results = await axe.run(element, AXE_OPTIONS);
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.html).join(', ')}`,
  );
  expect(summary).toEqual([]);
}

describe('accessibility (axe)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations(), provideRouter(routes)],
    });
  });

  it('question form has no axe violations', async () => {
    const fixture = TestBed.createComponent(QuestionForm);
    await fixture.whenStable();
    await expectNoViolations(fixture.nativeElement);
  });

  it('risk view has no axe violations', async () => {
    const store = TestBed.inject(PatientDataStore);
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4 });
    store.analyze();
    const fixture = TestBed.createComponent(RiskView);
    await fixture.whenStable();
    await expectNoViolations(fixture.nativeElement);
  });

  it('references page has no axe violations', async () => {
    const fixture = TestBed.createComponent(References);
    await fixture.whenStable();
    await expectNoViolations(fixture.nativeElement);
  });

  it('settings page has no axe violations', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    await expectNoViolations(fixture.nativeElement);
  });

  it('app shell has no axe violations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await expectNoViolations(fixture.nativeElement);
  });

  // TestBed attaches component fixtures to the real document, so running
  // against document.body (rather than a detached fragment, as the tests
  // above do) is what actually exercises document-level rules such as
  // `region` and `landmark-one-main`.
  it('document has no axe violations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await expectNoViolations(document.body);
  });
});

