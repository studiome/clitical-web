import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import ExcelJS from 'exceljs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';
import { BatchProcessing } from './batch-processing/batch-processing';
import { createBatchTemplateWorkbook } from './batch-processing/batch-workbook';
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
  beforeAll(() => {
    Object.assign(globalThis, { ExcelJS });
  });

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

  it('batch processing page has no axe violations', async () => {
    const fixture = TestBed.createComponent(BatchProcessing);
    await fixture.whenStable();
    await expectNoViolations(fixture.nativeElement);
  });

  // The empty-state render above never exercises the results table or its
  // tabindex="0" scroll container, so drive a populated result through too.
  it('batch processing page has no axe violations with results present', async () => {
    const template = await createBatchTemplateWorkbook('en');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template);
    const sheet = workbook.getWorksheet('Data Entry')!;
    const values = [
      'Female',
      65,
      150,
      50,
      4,
      'Ambulatory',
      'No',
      'No',
      'No',
      'No',
      'Yes',
      'No',
      'No',
      'No',
      'No',
      'No',
      'No',
      'No',
      'No',
      'No',
      'No',
      'No',
      'Class 4',
    ];
    values.forEach((value, index) => {
      sheet.getRow(2).getCell(index + 2).value = value;
    });
    const bytes = await workbook.xlsx.writeBuffer();
    const file = new File([bytes as unknown as BlobPart], 'patients.xlsx');

    const fixture = TestBed.createComponent(BatchProcessing);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('patient rows loaded');
    });

    (fixture.nativeElement.querySelector('[data-action="calculate"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

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
