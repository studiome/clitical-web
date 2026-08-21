import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TranslationService } from '../services/translation';
import { BatchCalculationResult, calculateBatchRows, RawBatchRow } from './batch-calculation';
import {
  createBatchResultWorkbook,
  createBatchTemplateWorkbook,
  readBatchWorkbook,
  BatchTemplateLocale,
} from './batch-workbook';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Component({
  selector: 'app-batch-processing',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './batch-processing.html',
  styleUrl: './batch-processing.scss',
})
export class BatchProcessing {
  protected readonly t = inject(TranslationService).t;
  protected readonly rows = signal<RawBatchRow[]>([]);
  protected readonly results = signal<BatchCalculationResult[]>([]);
  protected readonly message = signal('');
  protected readonly isBusy = signal(false);

  protected readonly successCount = computed(
    () => this.results().filter((result) => result.ok).length,
  );
  protected readonly errorCount = computed(
    () => this.results().filter((result) => !result.ok).length,
  );

  protected async downloadTemplate(locale: BatchTemplateLocale): Promise<void> {
    await this.runBusy(async () => {
      try {
        const bytes = await createBatchTemplateWorkbook(locale);
        this.download(bytes, `clitical-batch-template-${locale}.xlsx`);
      } catch {
        this.message.set(this.t().workbookWriteError);
      }
    });
  }

  protected async selectFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.rows.set([]);
    this.results.set([]);
    await this.runBusy(async () => {
      try {
        const bytes = (await file.arrayBuffer()) as unknown as import('exceljs').Buffer;
        const rows = await readBatchWorkbook(bytes);
        this.rows.set(rows);
        this.message.set(
          rows.length ? `${rows.length} ${this.t().selectedBatchRows}` : this.t().noPatientRows,
        );
      } catch {
        this.message.set(this.t().workbookReadError);
      } finally {
        // Clear the input so re-selecting the same filename (e.g. after
        // fixing the file and picking it again) still fires `change`.
        input.value = '';
      }
    });
  }

  protected calculate(): void {
    if (!this.rows().length) return;
    this.results.set(calculateBatchRows(this.rows()));
    this.message.set('');
  }

  protected async downloadResults(): Promise<void> {
    if (!this.results().length) return;
    await this.runBusy(async () => {
      try {
        const bytes = await createBatchResultWorkbook(this.results());
        this.download(bytes, 'clitical-batch-results.xlsx');
      } catch {
        this.message.set(this.t().workbookWriteError);
      }
    });
  }

  protected errors(result: BatchCalculationResult): string {
    return result.ok
      ? ''
      : result.errors.map((error) => `${error.field}: ${error.code}`).join(', ');
  }

  protected percent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  protected fixed(value: number): string {
    return value.toFixed(1);
  }

  private async runBusy(task: () => Promise<void>): Promise<void> {
    this.isBusy.set(true);
    try {
      await task();
    } finally {
      this.isBusy.set(false);
    }
  }

  private download(bytes: import('exceljs').Buffer, fileName: string): void {
    const blob = new Blob([bytes as unknown as BlobPart], { type: XLSX_MIME });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
