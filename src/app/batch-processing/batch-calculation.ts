import type {
  PatientData,
  Sex,
  Activity,
  Ckd,
  MalignantNeoplasm,
  RutherfordClassification,
} from '../models/patient-data';
import { calculatePatientRisk } from '../models/patient-risk';
import type { PatientRisk } from '../models/patient-risk';
import { formatCaseId } from './batch-schema';
import type { BatchField, BatchPatientInput } from './batch-schema';

export type RawBatchRow = Record<string, unknown>;

export type BatchErrorCode =
  | 'REQUIRED'
  | 'INVALID_NUMBER'
  | 'OUT_OF_RANGE'
  | 'INVALID_CHOICE'
  | 'INVALID_BOOLEAN'
  | 'LESION_REQUIRED'
  | 'CALCULATION_ERROR';

export interface BatchValidationError {
  field: BatchField | 'row';
  code: BatchErrorCode;
}

export type BatchCalculationResult =
  | {
      ok: true;
      caseId: string;
      input: BatchPatientInput;
      risk: PatientRisk;
    }
  | {
      ok: false;
      caseId: string;
      input: RawBatchRow;
      errors: BatchValidationError[];
    };

const CHOICES = {
  sex: ['male', 'female'] as const,
  activity: ['ambulatory', 'wheelchair', 'immobile'] as const,
  ckd: ['normal', 'g3', 'g4', 'g5', 'g5D'] as const,
  malignant: ['no', 'pastHistory', 'underTreatment'] as const,
  rutherford: ['class4', 'class5', 'class6'] as const,
};

function parseNumber(
  row: RawBatchRow,
  field: 'age' | 'heightCm' | 'weight' | 'alb',
  minExclusive: number,
  maxInclusive: number,
  errors: BatchValidationError[],
): number | null {
  const raw = row[field];
  if (raw === null || raw === undefined || String(raw).trim() === '') {
    errors.push({ field, code: 'REQUIRED' });
    return null;
  }
  const value = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(value)) {
    errors.push({ field, code: 'INVALID_NUMBER' });
    return null;
  }
  if (
    value <= minExclusive ||
    value > maxInclusive ||
    (field === 'age' && !Number.isInteger(value))
  ) {
    errors.push({ field, code: 'OUT_OF_RANGE' });
    return null;
  }
  return value;
}

function parseChoice<T extends string>(
  row: RawBatchRow,
  field: 'sex' | 'activity' | 'ckd' | 'malignant' | 'rutherford',
  choices: readonly T[],
  errors: BatchValidationError[],
): T | null {
  const raw = row[field];
  if (raw === null || raw === undefined || String(raw).trim() === '') {
    errors.push({ field, code: 'REQUIRED' });
    return null;
  }
  const value = String(raw).trim();
  const match = choices.find((choice) => choice.toLowerCase() === value.toLowerCase());
  if (!match) {
    errors.push({ field, code: 'INVALID_CHOICE' });
    return null;
  }
  return match;
}

function parseBoolean(
  row: RawBatchRow,
  field: Exclude<
    keyof PatientData,
    'sex' | 'age' | 'weight' | 'height' | 'alb' | 'activity' | 'ckd' | 'malignant' | 'rutherford'
  >,
  errors: BatchValidationError[],
): boolean | null {
  const value = row[field];
  if (typeof value === 'boolean') return value;
  if (value === 1) return true;
  if (value === 0) return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1', 'あり', '有'].includes(normalized)) return true;
    if (['false', 'no', 'n', '0', 'なし', '無'].includes(normalized)) return false;
  }
  errors.push({
    field,
    code: value === '' || value === null || value === undefined ? 'REQUIRED' : 'INVALID_BOOLEAN',
  });
  return null;
}

function parseRow(
  row: RawBatchRow,
  index: number,
): { input: BatchPatientInput | null; errors: BatchValidationError[] } {
  const errors: BatchValidationError[] = [];
  const caseId = String(row['caseId'] ?? '').trim() || formatCaseId(index);
  const sex = parseChoice(row, 'sex', CHOICES.sex, errors);
  const age = parseNumber(row, 'age', 0, 150, errors);
  const heightCm = parseNumber(row, 'heightCm', 0, 300, errors);
  const weight = parseNumber(row, 'weight', 0, 1000, errors);
  const alb = parseNumber(row, 'alb', 0, 20, errors);
  const activity = parseChoice(row, 'activity', CHOICES.activity, errors);
  const ckd = parseChoice(row, 'ckd', CHOICES.ckd, errors);
  const malignant = parseChoice(row, 'malignant', CHOICES.malignant, errors);
  const rutherford = parseChoice(row, 'rutherford', CHOICES.rutherford, errors);

  const hasCHF = parseBoolean(row, 'hasCHF', errors);
  const hasCVD = parseBoolean(row, 'hasCVD', errors);
  const hasAILesion = parseBoolean(row, 'hasAILesion', errors);
  const hasFPLesion = parseBoolean(row, 'hasFPLesion', errors);
  const hasBKLesion = parseBoolean(row, 'hasBKLesion', errors);
  const isUrgent = parseBoolean(row, 'isUrgent', errors);
  const hasFever = parseBoolean(row, 'hasFever', errors);
  const hasAbnormalWBC = parseBoolean(row, 'hasAbnormalWBC', errors);
  const hasLocalInfection = parseBoolean(row, 'hasLocalInfection', errors);
  const hasDyslipidemia = parseBoolean(row, 'hasDyslipidemia', errors);
  const isSmoking = parseBoolean(row, 'isSmoking', errors);
  const hasCAD = parseBoolean(row, 'hasCAD', errors);
  const hasContraLateralLesion = parseBoolean(row, 'hasContraLateralLesion', errors);
  const hasOtherVD = parseBoolean(row, 'hasOtherVD', errors);

  if (hasAILesion === false && hasFPLesion === false && hasBKLesion === false) {
    errors.push({ field: 'row', code: 'LESION_REQUIRED' });
  }

  if (
    errors.length ||
    sex === null ||
    age === null ||
    heightCm === null ||
    weight === null ||
    alb === null ||
    activity === null ||
    ckd === null ||
    malignant === null ||
    rutherford === null ||
    hasCHF === null ||
    hasCVD === null ||
    hasAILesion === null ||
    hasFPLesion === null ||
    hasBKLesion === null ||
    isUrgent === null ||
    hasFever === null ||
    hasAbnormalWBC === null ||
    hasLocalInfection === null ||
    hasDyslipidemia === null ||
    isSmoking === null ||
    hasCAD === null ||
    hasContraLateralLesion === null ||
    hasOtherVD === null
  ) {
    return { input: null, errors };
  }

  return {
    input: {
      caseId,
      sex: sex as Sex,
      age,
      heightCm,
      weight,
      alb,
      activity: activity as Activity,
      hasCHF,
      hasCVD,
      ckd: ckd as Ckd,
      malignant: malignant as MalignantNeoplasm,
      hasAILesion,
      hasFPLesion,
      hasBKLesion,
      isUrgent,
      hasFever,
      hasAbnormalWBC,
      hasLocalInfection,
      hasDyslipidemia,
      isSmoking,
      hasCAD,
      hasContraLateralLesion,
      hasOtherVD,
      rutherford: rutherford as RutherfordClassification,
    },
    errors,
  };
}

export function calculateBatchRows(rows: readonly RawBatchRow[]): BatchCalculationResult[] {
  return rows.map((row, index) => {
    const caseId = String(row['caseId'] ?? '').trim() || formatCaseId(index);
    const parsed = parseRow(row, index);
    if (!parsed.input) return { ok: false, caseId, input: row, errors: parsed.errors };

    try {
      const input = parsed.input;
      const { caseId: _caseId, heightCm, ...patientFields } = input;
      const patient: PatientData = { ...patientFields, height: heightCm / 100 };
      return { ok: true, caseId, input, risk: calculatePatientRisk(patient) };
    } catch {
      return {
        ok: false,
        caseId,
        input: row,
        errors: [{ field: 'row', code: 'CALCULATION_ERROR' }],
      };
    }
  });
}
