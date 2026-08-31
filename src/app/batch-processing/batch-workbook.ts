import type ExcelJS from 'exceljs';

import { APP_VERSION } from '../app-version';
import { AppLocale, MESSAGES, MessageKey } from '../services/messages';
import { BatchCalculationResult, RawBatchRow } from './batch-calculation';
import { BATCH_FIELDS, BatchField, formatCaseId } from './batch-schema';

const RESULT_SHEET = 'Results';
const TEMPLATE_ROW_COUNT = 100;

export type BatchTemplateLocale = AppLocale;

const TEMPLATE_TEXT = {
  en: {
    dataSheet: 'Data Entry',
    guideSheet: 'Question Guide',
    guideHeaders: ['Field code', 'Question name', 'Full name', 'Description', 'Allowed values'],
    freeText: 'Any text',
    caseIdDescription: 'Temporary ID used to match each input row with its calculation result.',
    noDescription: '—',
    invalidValue: 'Invalid value',
    chooseOne: 'Choose one of',
    invalidNumber: 'Invalid number',
    enterRange: 'Enter a value in the permitted range.',
  },
  ja: {
    dataSheet: '症例入力',
    guideSheet: '設問説明',
    guideHeaders: ['フィールドコード', '設問名', '説明', '入力可能な値'],
    freeText: '任意の文字列',
    caseIdDescription: '入力行と計算結果を対応付けるための仮IDです。',
    noDescription: '—',
    invalidValue: '入力値が不正です',
    chooseOne: '次から選択してください',
    invalidNumber: '数値が不正です',
    enterRange: '許容範囲内の数値を入力してください。',
  },
} as const;

const QUESTION_LABEL_KEYS: Record<Exclude<BatchField, 'caseId'>, MessageKey> = {
  sex: 'questionSexTitle',
  age: 'questionAgeTitle',
  heightCm: 'questionHeightTitle',
  weight: 'questionWeightTitle',
  alb: 'questionAlbTitle',
  activity: 'questionActivityTitle',
  hasCHF: 'questionCHFTitle',
  hasCVD: 'questionCVDTitle',
  ckd: 'questionCKDTitle',
  malignant: 'questionMalignantTitle',
  hasAILesion: 'questionAILesionTitle',
  hasFPLesion: 'questionFPLesionTitle',
  hasBKLesion: 'questionBKLesionTitle',
  isUrgent: 'questionUrgentTitle',
  hasFever: 'questionFeverTitle',
  hasAbnormalWBC: 'questionAbnormalWBCTitle',
  hasLocalInfection: 'questionLocalInfectionTitle',
  hasDyslipidemia: 'questionDLTitle',
  isSmoking: 'questionSmokingTitle',
  hasCAD: 'questionCADTitle',
  hasContraLateralLesion: 'questionContraTitle',
  hasOtherVD: 'questionOtherLesionTitle',
  rutherford: 'questionRutherfordTitle',
};

const QUESTION_DESCRIPTION_KEYS: Partial<Record<Exclude<BatchField, 'caseId'>, MessageKey>> = {
  sex: 'questionSexSubtitle',
  age: 'questionAgeSubtitle',
  heightCm: 'questionHeightSubtitle',
  weight: 'questionWeightSubtitle',
  alb: 'questionAlbSubtitle',
  hasCHF: 'questionCHFSubtitle',
  hasCVD: 'questionCVDSubtitle',
  ckd: 'questionCKDSubtitle',
  hasAILesion: 'questionAILesionSubtitle',
  hasFPLesion: 'questionFPLesionSubtitle',
  hasBKLesion: 'questionBKLesionSubtitle',
  isUrgent: 'questionUrgentSubtitle',
  hasFever: 'questionFeverSubtitle',
  hasAbnormalWBC: 'questionAbnormalWBCSubtitle',
  hasLocalInfection: 'questionLocalInfectionSubtitle',
  hasDyslipidemia: 'questionDLSubtitle',
  isSmoking: 'questionSmokingSubtitle',
  hasCAD: 'questionCADSubtitle',
  hasContraLateralLesion: 'questionContraSubtitle',
  hasOtherVD: 'questionOtherLesionSubtitle',
};

const ENGLISH_FULL_NAMES: Partial<Record<BatchField, string>> = {
  alb: 'Serum Albumin (Alb)',
  activity: 'Activities of Daily Living (ADL)',
  ckd: 'Chronic Kidney Disease (CKD); Estimated Glomerular Filtration Rate (eGFR)',
  hasAbnormalWBC: 'White Blood Cell Count (WBC)',
  hasDyslipidemia: 'Low-Density Lipoprotein Cholesterol (LDL-C)',
};

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

  const loading = new Promise<ExcelJSRuntime>((resolve, reject) => {
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
  runtime.cliticalExcelJSLoading = loading;
  return loading.catch((error: unknown) => {
    if (runtime.cliticalExcelJSLoading === loading) {
      delete runtime.cliticalExcelJSLoading;
    }
    throw error;
  });
}

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

const CHOICE_MESSAGE_KEYS: Partial<
  Record<BatchField, readonly { value: string | boolean; key: MessageKey }[]>
> = {
  sex: [
    { value: 'male', key: 'male' },
    { value: 'female', key: 'female' },
  ],
  activity: [
    { value: 'ambulatory', key: 'ambulatory' },
    { value: 'wheelchair', key: 'wheelchair' },
    { value: 'immobile', key: 'immobile' },
  ],
  ckd: [
    { value: 'normal', key: 'normal' },
    { value: 'g3', key: 'g3' },
    { value: 'g4', key: 'g4' },
    { value: 'g5', key: 'g5' },
    { value: 'g5D', key: 'g5D' },
  ],
  malignant: [
    { value: 'no', key: 'noMalignancy' },
    { value: 'pastHistory', key: 'pastHistory' },
    { value: 'underTreatment', key: 'underTreatment' },
  ],
  rutherford: [
    { value: 'class4', key: 'class4' },
    { value: 'class5', key: 'class5' },
    { value: 'class6', key: 'class6' },
  ],
};

const HEADER_FILL = 'FF2D6A7B';
const INPUT_FILL = 'FFFFF4CC';
const ERROR_FILL = 'FFFFE0E0';

function fieldLabel(locale: BatchTemplateLocale, field: BatchField): string {
  if (field === 'caseId') return MESSAGES[locale].caseId;
  return MESSAGES[locale][QUESTION_LABEL_KEYS[field]];
}

function fieldDescription(locale: BatchTemplateLocale, field: BatchField): string {
  const text = TEMPLATE_TEXT[locale];
  if (field === 'caseId') return text.caseIdDescription;
  const key = QUESTION_DESCRIPTION_KEYS[field];
  const description = key ? MESSAGES[locale][key].trim() : '';
  return description || text.noDescription;
}

function fieldChoices(
  locale: BatchTemplateLocale,
  field: BatchField,
): readonly { value: string | boolean; label: string }[] {
  const choices = CHOICE_MESSAGE_KEYS[field];
  if (choices) {
    return choices.map((choice) => ({
      value: choice.value,
      label: MESSAGES[locale][choice.key],
    }));
  }
  if (BOOLEAN_FIELDS.has(field)) {
    return [
      { value: true, label: MESSAGES[locale].yes },
      { value: false, label: MESSAGES[locale].no },
    ];
  }
  return [];
}

function allowedValues(locale: BatchTemplateLocale, field: BatchField): string {
  if (field === 'caseId') return TEMPLATE_TEXT[locale].freeText;
  const choices = fieldChoices(locale, field);
  if (choices.length) return choices.map((choice) => choice.label).join(' / ');
  const numeric = NUMERIC_VALIDATION[field];
  if (!numeric) return '';
  const integer = numeric.type === 'whole' ? (locale === 'ja' ? '（整数）' : ' (integer)') : '';
  return locale === 'ja'
    ? `0より大きく${numeric.max}以下${integer}`
    : `Greater than 0 and at most ${numeric.max}${integer}`;
}

function styleHeader(row: ExcelJS.Row): void {
  row.height = 30;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

function setColumnWidths(sheet: ExcelJS.Worksheet, locale: BatchTemplateLocale): void {
  sheet.columns.forEach((column, index) => {
    const field = BATCH_FIELDS[index];
    if (!field) return;
    column.width = Math.min(38, Math.max(16, fieldLabel(locale, field).length + 4));
  });
}

function addInputValidation(sheet: ExcelJS.Worksheet, locale: BatchTemplateLocale): void {
  const text = TEMPLATE_TEXT[locale];
  BATCH_FIELDS.forEach((field, index) => {
    if (field === 'caseId') return;
    const column = index + 1;
    const rangeStart = 2;
    const rangeEnd = TEMPLATE_ROW_COUNT + 1;
    for (let row = rangeStart; row <= rangeEnd; row += 1) {
      const cell = sheet.getCell(row, column);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_FILL } };
      const values = fieldChoices(locale, field).map((choice) => choice.label);
      if (values.length) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${values.join(',')}"`],
          showErrorMessage: true,
          errorTitle: text.invalidValue,
          error: `${text.chooseOne}: ${values.join(', ')}`,
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
            errorTitle: text.invalidNumber,
            error: text.enterRange,
          };
        }
      }
    }
  });
}

export async function createBatchTemplateWorkbook(
  locale: BatchTemplateLocale = 'en',
): Promise<ExcelJS.Buffer> {
  const ExcelJSRuntime = await loadExcelJS();
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'CLiTICAL';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const text = TEMPLATE_TEXT[locale];
  const input = workbook.addWorksheet(text.dataSheet, {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
    properties: { defaultRowHeight: 20 },
  });
  input.addRow(BATCH_FIELDS.map((field) => fieldLabel(locale, field)));
  styleHeader(input.getRow(1));
  for (let index = 0; index < TEMPLATE_ROW_COUNT; index += 1) {
    input.addRow([formatCaseId(index)]);
  }
  setColumnWidths(input, locale);
  addInputValidation(input, locale);
  input.autoFilter = { from: 'A1', to: input.getCell(1, BATCH_FIELDS.length).address };

  const guide = workbook.addWorksheet(text.guideSheet, {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { defaultRowHeight: 36, tabColor: { argb: 'FF5B8C85' } },
  });
  guide.addRow([...text.guideHeaders]);
  for (const field of BATCH_FIELDS) {
    guide.addRow(
      locale === 'en'
        ? [
            field,
            fieldLabel(locale, field),
            ENGLISH_FULL_NAMES[field] ?? text.noDescription,
            fieldDescription(locale, field),
            allowedValues(locale, field),
          ]
        : [
            field,
            fieldLabel(locale, field),
            fieldDescription(locale, field),
            allowedValues(locale, field),
          ],
    );
  }
  styleHeader(guide.getRow(1));
  guide.columns =
    locale === 'en'
      ? [{ width: 28 }, { width: 44 }, { width: 52 }, { width: 76 }, { width: 42 }]
      : [{ width: 28 }, { width: 44 }, { width: 76 }, { width: 42 }];
  guide.eachRow((row, rowNumber) => {
    if (rowNumber <= 1) return;
    row.height = 60;
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFD5DDDA' } },
      };
      if (rowNumber % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F7F5' } };
      }
    });
  });
  guide.autoFilter = { from: 'A1', to: guide.getCell(1, text.guideHeaders.length).address };

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

function normalizeLocalizedValue(
  locale: BatchTemplateLocale,
  field: BatchField,
  value: unknown,
): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLocaleLowerCase(locale);
  const match = fieldChoices(locale, field).find(
    (choice) => choice.label.trim().toLocaleLowerCase(locale) === normalized,
  );
  return match?.value ?? value;
}

export async function readBatchWorkbook(data: ExcelJS.Buffer): Promise<RawBatchRow[]> {
  const ExcelJSRuntime = await loadExcelJS();
  const workbook = new ExcelJSRuntime.Workbook();
  await workbook.xlsx.load(data);
  const locale: BatchTemplateLocale | undefined = workbook.getWorksheet(TEMPLATE_TEXT.ja.dataSheet)
    ? 'ja'
    : workbook.getWorksheet(TEMPLATE_TEXT.en.dataSheet)
      ? 'en'
      : undefined;
  if (!locale) throw new Error('The CLiTICAL data entry worksheet was not found.');
  const sheet = workbook.getWorksheet(TEMPLATE_TEXT[locale].dataSheet)!;

  const headers = BATCH_FIELDS.map((_, index) =>
    String(sheet.getCell(1, index + 1).value ?? '').trim(),
  );
  if (headers.some((header, index) => header !== fieldLabel(locale, BATCH_FIELDS[index]))) {
    throw new Error('The worksheet headers do not match the CLiTICAL template.');
  }

  const rows: RawBatchRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row: RawBatchRow = {};
    BATCH_FIELDS.forEach((field, index) => {
      row[field] = normalizeLocalizedValue(
        locale,
        field,
        cellValue(sheet.getCell(rowNumber, index + 1).value),
      );
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
