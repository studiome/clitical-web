import ExcelJS from 'exceljs';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createBatchResultWorkbook,
  createBatchTemplateWorkbook,
  readBatchWorkbook,
} from './batch-workbook';
import { calculateBatchRows } from './batch-calculation';

describe('batch workbook', () => {
  beforeAll(() => {
    Object.assign(globalThis, { ExcelJS });
  });
  it('creates a Japanese template using the web app question names and choices', async () => {
    const bytes = await createBatchTemplateWorkbook('ja');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);

    const input = workbook.getWorksheet('症例入力');
    expect(input?.getCell('A1').value).toBe('仮症例ID');
    expect(input?.getCell('B1').value).toBe('性別');
    expect(input?.getCell('C1').value).toBe('年齢 [歳]');
    expect(input?.getCell('D1').value).toBe('身長 [cm]');
    expect(input?.getCell('A2').value).toBe('CASE-0001');
    expect(input?.getCell('A101').value).toBe('CASE-0100');
    const guide = workbook.getWorksheet('設問説明');
    expect(guide).toBeTruthy();
    expect(workbook.worksheets.map((sheet) => sheet.name).slice(0, 2)).toEqual([
      '症例入力',
      '設問説明',
    ]);
    expect(guide?.getRow(1).values).toEqual([
      undefined,
      'フィールドコード',
      '設問名',
      '説明',
      '入力可能な値',
    ]);
    expect(guide?.getCell('B10').value).toBe('脳血管障害');
    expect(String(guide?.getCell('C10').value)).toContain('脳梗塞');
    expect(guide?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(guide?.getCell('C10').alignment).toMatchObject({ wrapText: true });
    expect(guide?.autoFilter).toBeTruthy();
    expect(input?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1, xSplit: 1 });
    expect(input?.getCell('B2').dataValidation).toMatchObject({
      type: 'list',
      formulae: ['"男性,女性"'],
    });
    expect(input?.getCell('C2').dataValidation).toMatchObject({
      type: 'whole',
      operator: 'between',
    });
  });

  it('creates a separate English template using the web app question names', async () => {
    const bytes = await createBatchTemplateWorkbook('en');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);

    const input = workbook.getWorksheet('Data Entry');
    expect(input?.getCell('A1').value).toBe('Case ID');
    expect(input?.getCell('B1').value).toBe('Sex');
    expect(input?.getCell('C1').value).toBe('Age [year-old]');
    expect(input?.getCell('D1').value).toBe('Body Height [cm]');
    expect(input?.getCell('B2').dataValidation).toMatchObject({
      type: 'list',
      formulae: ['"Male,Female"'],
    });
    const guide = workbook.getWorksheet('Question Guide');
    expect(guide).toBeTruthy();
    expect(workbook.worksheets.map((sheet) => sheet.name).slice(0, 2)).toEqual([
      'Data Entry',
      'Question Guide',
    ]);
    expect(guide?.getRow(1).values).toEqual([
      undefined,
      'Field code',
      'Question name',
      'Full name',
      'Description',
      'Allowed values',
    ]);
    expect(guide?.getCell('C8').value).toBe('Activities of Daily Living (ADL)');
    expect(String(guide?.getCell('C11').value)).toContain('Estimated Glomerular Filtration Rate');
    expect(guide?.getCell('C18').value).toBe('White Blood Cell Count (WBC)');
    expect(guide?.getCell('C20').value).toBe('Low-Density Lipoprotein Cholesterol (LDL-C)');
    expect(String(guide?.getCell('D11').value)).toContain('estimated glomerular filtration rate');
  });

  it('reads only populated data rows and preserves their case IDs', async () => {
    const template = await createBatchTemplateWorkbook('ja');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template);
    const input = workbook.getWorksheet('症例入力')!;
    const values = [
      '女性',
      65,
      150,
      50,
      4,
      '独歩',
      'なし',
      'なし',
      '正常',
      'なし',
      'あり',
      'なし',
      'なし',
      'なし',
      'なし',
      'なし',
      'なし',
      'なし',
      'なし',
      'なし',
      'なし',
      'なし',
      'Class 4',
    ];
    values.forEach((value, index) => {
      input.getRow(2).getCell(index + 2).value = value;
    });
    const bytes = await workbook.xlsx.writeBuffer();

    const rows = await readBatchWorkbook(bytes);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      caseId: 'CASE-0001',
      sex: 'female',
      age: 65,
      activity: 'ambulatory',
      hasAILesion: true,
      rutherford: 'class4',
    });
  });

  it('maps English template choices to the calculation values', async () => {
    const template = await createBatchTemplateWorkbook('en');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template);
    const input = workbook.getWorksheet('Data Entry')!;
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
      input.getRow(2).getCell(index + 2).value = value;
    });

    const rows = await readBatchWorkbook(await workbook.xlsx.writeBuffer());

    expect(rows[0]).toMatchObject({
      sex: 'female',
      activity: 'ambulatory',
      ckd: 'normal',
      malignant: 'no',
      hasAILesion: true,
      rutherford: 'class4',
    });
  });

  it('writes successful calculations and validation errors to a result workbook', async () => {
    const base = {
      caseId: 'CASE-0001',
      sex: 'female',
      age: 65,
      heightCm: 150,
      weight: 50,
      alb: 4,
      activity: 'ambulatory',
      hasCHF: false,
      hasCVD: false,
      ckd: 'normal',
      malignant: 'no',
      hasAILesion: true,
      hasFPLesion: false,
      hasBKLesion: false,
      isUrgent: false,
      hasFever: false,
      hasAbnormalWBC: false,
      hasLocalInfection: false,
      hasDyslipidemia: false,
      isSmoking: false,
      hasCAD: false,
      hasContraLateralLesion: false,
      hasOtherVD: false,
      rutherford: 'class4',
    };
    const results = calculateBatchRows([base, { ...base, caseId: 'CASE-0002', alb: '' }]);

    const bytes = await createBatchResultWorkbook(results);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    const sheet = workbook.getWorksheet('Results')!;

    expect(sheet.getCell('A2').value).toBe('CASE-0001');
    expect(sheet.getCell('B2').value).toBe('success');
    expect(sheet.getCell('B3').value).toBe('error');
    expect(String(sheet.getCell('C3').value)).toContain('alb');
  });

  it('allows ExcelJS script loading to be retried after a failure', async () => {
    type RuntimeGlobals = typeof globalThis & {
      ExcelJS?: typeof ExcelJS;
      cliticalExcelJSLoading?: Promise<typeof ExcelJS>;
    };
    type Script = {
      src: string;
      async: boolean;
      onload: (() => void) | null;
      onerror: (() => void) | null;
    };

    const runtime = globalThis as RuntimeGlobals;
    const originalExcelJS = runtime.ExcelJS;
    const originalLoading = runtime.cliticalExcelJSLoading;
    const scripts: Script[] = [];
    const documentMock = {
      baseURI: 'https://example.test/',
      createElement: (tagName: string): Script => {
        expect(tagName).toBe('script');
        const script: Script = { src: '', async: false, onload: null, onerror: null };
        scripts.push(script);
        return script;
      },
      head: {
        append: (script: Script) => {
          if (scripts.length === 1) {
            script.onerror?.();
          } else {
            runtime.ExcelJS = ExcelJS;
            script.onload?.();
          }
        },
      },
    };

    delete runtime.ExcelJS;
    delete runtime.cliticalExcelJSLoading;
    vi.stubGlobal('document', documentMock);

    try {
      await expect(createBatchTemplateWorkbook('en')).rejects.toThrow(
        'ExcelJS could not be loaded.',
      );
      expect(runtime.cliticalExcelJSLoading).toBeUndefined();

      const bytes = await createBatchTemplateWorkbook('en');

      expect(scripts).toHaveLength(2);
      expect(scripts[0].src).toContain('vendor/exceljs/exceljs.min.js');
      expect(scripts[1].src).toContain('vendor/exceljs/exceljs.min.js');
      expect(bytes.byteLength).toBeGreaterThan(0);
    } finally {
      if (originalExcelJS) runtime.ExcelJS = originalExcelJS;
      else delete runtime.ExcelJS;
      if (originalLoading) runtime.cliticalExcelJSLoading = originalLoading;
      else delete runtime.cliticalExcelJSLoading;
      vi.unstubAllGlobals();
    }
  });
});
