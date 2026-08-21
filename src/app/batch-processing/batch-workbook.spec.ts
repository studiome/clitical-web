import ExcelJS from 'exceljs';
import { beforeAll, describe, expect, it } from 'vitest';

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
  it('creates a template with stable headers, guidance, and sequential case IDs', async () => {
    const bytes = await createBatchTemplateWorkbook();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);

    const input = workbook.getWorksheet('Data Entry');
    expect(input?.getCell('A1').value).toBe('caseId');
    expect(input?.getCell('A2').value).toBe('CASE-0001');
    expect(input?.getCell('A101').value).toBe('CASE-0100');
    expect(workbook.getWorksheet('Input Guide')).toBeTruthy();
    expect(input?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1, xSplit: 1 });
    expect(input?.getCell('B2').dataValidation).toMatchObject({ type: 'list' });
    expect(input?.getCell('C2').dataValidation).toMatchObject({
      type: 'whole',
      operator: 'between',
    });
  });

  it('reads only populated data rows and preserves their case IDs', async () => {
    const template = await createBatchTemplateWorkbook();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template);
    const input = workbook.getWorksheet('Data Entry')!;
    const values = [
      'female',
      65,
      150,
      50,
      4,
      'ambulatory',
      false,
      false,
      'normal',
      'no',
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      'class4',
    ];
    values.forEach((value, index) => {
      input.getRow(2).getCell(index + 2).value = value;
    });
    const bytes = await workbook.xlsx.writeBuffer();

    const rows = await readBatchWorkbook(bytes);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ caseId: 'CASE-0001', age: 65 });
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
});
