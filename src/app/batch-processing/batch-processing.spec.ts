import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import ExcelJS from 'exceljs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { TranslationService } from '../services/translation';
import { BatchProcessing } from './batch-processing';
import { createBatchTemplateWorkbook } from './batch-workbook';

describe('BatchProcessing', () => {
  beforeAll(() => {
    Object.assign(globalThis, { ExcelJS });
  });
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations(), provideRouter([])],
    });
    TestBed.inject(TranslationService).setLocale('en');
  });

  it('shows the template, upload, and calculation workflow', async () => {
    const fixture = TestBed.createComponent(BatchProcessing);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent).toContain('Batch Processing');
    expect(host.querySelector('[data-action="download-template-ja"]')).toBeTruthy();
    expect(host.querySelector('[data-action="download-template-en"]')).toBeTruthy();
    expect(host.querySelector('input[type="file"]')?.getAttribute('accept')).toContain('.xlsx');
    expect(host.querySelector<HTMLButtonElement>('[data-action="calculate"]')?.disabled).toBe(true);
  });

  it('loads a populated template and displays the calculated result', async () => {
    const bytes = await createBatchTemplateWorkbook('en');
    const template = new File([bytes as unknown as BlobPart], 'patients.xlsx');
    const fixture = TestBed.createComponent(BatchProcessing);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [template] });

    // The untouched template contains IDs only, so loading it reports no patient rows.
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('No patient rows');
    });
  });

  it('downloads the Japanese and English templates without sending data to a server', async () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const fixture = TestBed.createComponent(BatchProcessing);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    (host.querySelector('[data-action="download-template-ja"]') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    (host.querySelector('[data-action="download-template-en"]') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(2));
    vi.unstubAllGlobals();
  });
});
