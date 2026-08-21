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
    expect(workbook.getWorksheet('入力ガイド')).toBeTruthy();
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
    expect(workbook.getWorksheet('Input Guide')).toBeTruthy();
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
});
