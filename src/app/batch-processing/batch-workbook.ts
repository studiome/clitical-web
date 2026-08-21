import type ExcelJS from 'exceljs';

import { APP_VERSION } from '../app-version';
import { BatchCalculationResult, RawBatchRow } from './batch-calculation';
import { BATCH_FIELDS, BatchField, formatCaseId } from './batch-schema';

const DATA_SHEET = 'Data Entry';
const GUIDE_SHEET = 'Input Guide';
const RESULT_SHEET = 'Results';
const TEMPLATE_ROW_COUNT = 100;

type ExcelJSRuntime = typeof ExcelJS;

interface ExcelJSGlobal {
  ExcelJS?: ExcelJSRuntime;
  cliticalExcelJSLoading?: Promise<ExcelJSRuntime>;
}

async function loadExcelJS(): Promise<ExcelJSRuntime> {
  const runtime = globalThis as typeof globalThis & ExcelJSGlobal;
  if (runtime.ExcelJS) return runtime.ExcelJS;
  if (runtime.cliticalExcelJSLoading) return runtime.cliticalExcelJSLoading;
  if (typeof document === 'undefined') {
    throw new Error('Excel processing is only available in a browser.');
  }

  runtime.cliticalExcelJSLoading = new Promise<ExcelJSRuntime>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('vendor/exceljs/exceljs.min.js', document.baseURI).toString();
    script.async = true;
    script.onload = () => {
      if (runtime.ExcelJS) resolve(runtime.ExcelJS);
      else reject(new Error('ExcelJS did not initialize.'));
    };
    script.onerror = () => reject(new Error('ExcelJS could not be loaded.'));
    document.head.append(script);
  });
  return runtime.cliticalExcelJSLoading;
}

const ENUM_VALUES: Partial<Record<BatchField, readonly string[]>> = {
  sex: ['male', 'female'],
  activity: ['ambulatory', 'wheelchair', 'immobile'],
  ckd: ['normal', 'g3', 'g4', 'g5', 'g5D'],
  malignant: ['no', 'pastHistory', 'underTreatment'],
  rutherford: ['class4', 'class5', 'class6'],
};

const NUMERIC_VALIDATION: Partial<
  Record<BatchField, { type: 'whole' | 'decimal'; min: number; max: number }>
> = {
  age: { type: 'whole', min: 1, max: 150 },
  heightCm: { type: 'decimal', min: 0.000001, max: 300 },
  weight: { type: 'decimal', min: 0.000001, max: 1000 },
  alb: { type: 'decimal', min: 0.000001, max: 20 },
};

const BOOLEAN_FIELDS = new Set<BatchField>([
  'hasCHF',
  'hasCVD',
  'hasAILesion',
  'hasFPLesion',
  'hasBKLesion',
  'isUrgent',
  'hasFever',
  'hasAbnormalWBC',
  'hasLocalInfection',
  'hasDyslipidemia',
  'isSmoking',
  'hasCAD',
  'hasContraLateralLesion',
  'hasOtherVD',
]);

const FIELD_GUIDE: Record<BatchField, { ja: string; en: string; allowed: string; unit: string }> = {
  caseId: {
    ja: '仮症例ID（個人を特定できる情報は入力しない）',
    en: 'Temporary case ID (no direct identifiers)',
    allowed: '任意の文字列',
    unit: '',
  },
  sex: { ja: '性別', en: 'Sex', allowed: 'male / female', unit: '' },
  age: { ja: '年齢', en: 'Age', allowed: '1–150の整数', unit: 'years' },
  heightCm: { ja: '身長', en: 'Body height', allowed: '0より大きく300以下', unit: 'cm' },
  weight: { ja: '体重', en: 'Body weight', allowed: '0より大きく1000以下', unit: 'kg' },
  alb: { ja: '血清アルブミン', en: 'Serum albumin', allowed: '0より大きく20以下', unit: 'g/dL' },
  activity: { ja: 'ADL', en: 'Activity', allowed: 'ambulatory / wheelchair / immobile', unit: '' },
  hasCHF: { ja: 'うっ血性心不全', en: 'Congestive heart failure', allowed: 'yes / no', unit: '' },
  hasCVD: { ja: '脳血管障害', en: 'Cerebrovascular disease', allowed: 'yes / no', unit: '' },
  ckd: {
    ja: '慢性腎臓病',
    en: 'Chronic kidney disease',
    allowed: 'normal / g3 / g4 / g5 / g5D',
    unit: '',
  },
  malignant: {
    ja: '悪性新生物',
    en: 'Malignant neoplasm',
    allowed: 'no / pastHistory / underTreatment',
    unit: '',
  },
  hasAILesion: {
    ja: '大動脈腸骨動脈領域病変',
    en: 'Aorto-iliac lesion',
    allowed: 'yes / no',
    unit: '',
  },
  hasFPLesion: {
    ja: '大腿膝窩領域病変',
    en: 'Femoro-popliteal lesion',
    allowed: 'yes / no',
    unit: '',
  },
  hasBKLesion: {
    ja: '膝下膝窩以下末梢領域病変',
    en: 'Infrapopliteal lesion',
    allowed: 'yes / no',
    unit: '',
  },
  isUrgent: { ja: '緊急血行再建', en: 'Urgent revascularisation', allowed: 'yes / no', unit: '' },
  hasFever: { ja: '発熱', en: 'Fever', allowed: 'yes / no', unit: '' },
  hasAbnormalWBC: { ja: '白血球数異常', en: 'Abnormal WBC', allowed: 'yes / no', unit: '' },
  hasLocalInfection: { ja: '局所感染', en: 'Local infection', allowed: 'yes / no', unit: '' },
  hasDyslipidemia: { ja: '脂質異常症', en: 'Dyslipidemia', allowed: 'yes / no', unit: '' },
  isSmoking: {
    ja: '喫煙・喫煙歴',
    en: 'Smoking or smoking history',
    allowed: 'yes / no',
    unit: '',
  },
  hasCAD: { ja: '冠動脈疾患', en: 'Coronary artery disease', allowed: 'yes / no', unit: '' },
  hasContraLateralLesion: {
    ja: '対側動脈病変',
    en: 'Contralateral arterial lesion',
    allowed: 'yes / no',
    unit: '',
  },
  hasOtherVD: { ja: 'その他血管病変', en: 'Other vascular lesion', allowed: 'yes / no', unit: '' },
  rutherford: {
    ja: 'ラザフォード分類',
    en: 'Rutherford classification',
    allowed: 'class4 / class5 / class6',
    unit: '',
  },
};

const HEADER_FILL = 'FF2D6A7B';
const INPUT_FILL = 'FFFFF4CC';
const ERROR_FILL = 'FFFFE0E0';

function styleHeader(row: ExcelJS.Row): void {
  row.height = 30;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

function setColumnWidths(sheet: ExcelJS.Worksheet): void {
  sheet.columns.forEach((column, index) => {
    const field = BATCH_FIELDS[index];
    column.width =
      field === 'caseId' ? 16 : field && FIELD_GUIDE[field].allowed.length > 24 ? 22 : 16;
  });
}

function addInputValidation(sheet: ExcelJS.Worksheet): void {
  BATCH_FIELDS.forEach((field, index) => {
    if (field === 'caseId') return;
    const column = index + 1;
    const rangeStart = 2;
    const rangeEnd = TEMPLATE_ROW_COUNT + 1;
    for (let row = rangeStart; row <= rangeEnd; row += 1) {
      const cell = sheet.getCell(row, column);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_FILL } };
      const values = ENUM_VALUES[field] ?? (BOOLEAN_FIELDS.has(field) ? ['yes', 'no'] : null);
      if (values) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${values.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Invalid value',
          error: `Choose one of: ${values.join(', ')}`,
        };
      } else {
        const numeric = NUMERIC_VALIDATION[field];
        if (numeric) {
          cell.dataValidation = {
            type: numeric.type,
            operator: 'between',
            allowBlank: false,
            formulae: [numeric.min, numeric.max],
            showErrorMessage: true,
            errorTitle: 'Invalid number',
            error: `Enter a value between ${numeric.min} and ${numeric.max}.`,
          };
        }
      }
    }
  });
}

export async function createBatchTemplateWorkbook(): Promise<ExcelJS.Buffer> {
  const ExcelJSRuntime = await loadExcelJS();
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'CLiTICAL';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const input = workbook.addWorksheet(DATA_SHEET, {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
    properties: { defaultRowHeight: 20 },
  });
  input.addRow([...BATCH_FIELDS]);
  styleHeader(input.getRow(1));
  for (let index = 0; index < TEMPLATE_ROW_COUNT; index += 1) {
    input.addRow([formatCaseId(index)]);
  }
  setColumnWidths(input);
  addInputValidation(input);
  input.autoFilter = { from: 'A1', to: input.getCell(1, BATCH_FIELDS.length).address };

  const guide = workbook.addWorksheet(GUIDE_SHEET, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  guide.addRow(['field', '日本語', 'English', '入力値 / Allowed values', '単位 / Unit']);
  for (const field of BATCH_FIELDS) {
    const item = FIELD_GUIDE[field];
    guide.addRow([field, item.ja, item.en, item.allowed, item.unit]);
  }
  styleHeader(guide.getRow(1));
  guide.columns = [{ width: 28 }, { width: 34 }, { width: 34 }, { width: 42 }, { width: 16 }];
  guide.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: 'top', wrapText: true };
  });

  return workbook.xlsx.writeBuffer();
}

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  const object = value as unknown as Record<string, unknown>;
  if ('result' in object) return cellValue(object['result'] as ExcelJS.CellValue);
  if ('text' in object && typeof object['text'] === 'string') return object['text'];
  if ('richText' in object && Array.isArray(object['richText'])) {
    return object['richText']
      .map((part) =>
        typeof part === 'object' && part !== null && 'text' in part ? String(part.text) : '',
      )
      .join('');
  }
  return String(value);
}

function hasPatientData(row: RawBatchRow): boolean {
  return BATCH_FIELDS.some((field) => {
    if (field === 'caseId') return false;
    const value = row[field];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
}

export async function readBatchWorkbook(data: ExcelJS.Buffer): Promise<RawBatchRow[]> {
  const ExcelJSRuntime = await loadExcelJS();
  const workbook = new ExcelJSRuntime.Workbook();
  await workbook.xlsx.load(data);
  const sheet = workbook.getWorksheet(DATA_SHEET);
  if (!sheet) throw new Error(`Worksheet "${DATA_SHEET}" was not found.`);

  const headers = BATCH_FIELDS.map((_, index) =>
    String(sheet.getCell(1, index + 1).value ?? '').trim(),
  );
  if (headers.some((header, index) => header !== BATCH_FIELDS[index])) {
    throw new Error('The Data Entry headers do not match the CLiTICAL template.');
  }

  const rows: RawBatchRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row: RawBatchRow = {};
    BATCH_FIELDS.forEach((field, index) => {
      row[field] = cellValue(sheet.getCell(rowNumber, index + 1).value);
    });
    if (hasPatientData(row)) rows.push(row);
  }
  return rows;
}

const RESULT_HEADERS = [
  'caseId',
  'status',
  'errors',
  ...BATCH_FIELDS.filter((field) => field !== 'caseId'),
  'gnri',
  'gnriRisk',
  'predicted2YearOS',
  'osRisk',
  'predicted2YearAFS',
  'predicted30DayDeathOrAmputation',
  'predicted30DayMALE',
  'modelVersion',
] as const;

export async function createBatchResultWorkbook(
  results: readonly BatchCalculationResult[],
): Promise<ExcelJS.Buffer> {
  const ExcelJSRuntime = await loadExcelJS();
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'CLiTICAL';
  const sheet = workbook.addWorksheet(RESULT_SHEET, {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });
  sheet.addRow([...RESULT_HEADERS]);
  styleHeader(sheet.getRow(1));

  for (const result of results) {
    const values = BATCH_FIELDS.filter((field) => field !== 'caseId').map((field) =>
      result.ok ? result.input[field] : (result.input[field] ?? null),
    );
    const output = result.ok
      ? [
          result.risk.gnri,
          result.risk.gnriRisk ?? '',
          result.risk.predictedOS,
          result.risk.osRisk ?? '',
          result.risk.predictedAFS,
          result.risk.predicted30DDeathOrAmputation,
          result.risk.predicted30DMALE,
          APP_VERSION,
        ]
      : ['', '', '', '', '', '', '', APP_VERSION];
    const errors = result.ok
      ? ''
      : result.errors.map((error) => `${error.field}:${error.code}`).join('; ');
    const row = sheet.addRow([
      result.caseId,
      result.ok ? 'success' : 'error',
      errors,
      ...values,
      ...output,
    ]);
    if (!result.ok) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ERROR_FILL } };
      });
    }
  }

  sheet.columns.forEach((column, index) => {
    column.width = index === 2 ? 32 : index === 0 ? 16 : 18;
  });
  const outputStart = 3 + (BATCH_FIELDS.length - 1);
  for (let index = 0; index < results.length; index += 1) {
    const row = index + 2;
    sheet.getCell(row, outputStart + 1).numFmt = '0.0';
    for (const offset of [3, 5, 6, 7]) {
      sheet.getCell(row, outputStart + offset).numFmt = '0.0%';
    }
  }
  sheet.autoFilter = { from: 'A1', to: sheet.getCell(1, RESULT_HEADERS.length).address };
  return workbook.xlsx.writeBuffer();
}
