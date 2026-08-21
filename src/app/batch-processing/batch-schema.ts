import type {
  PatientData,
  Sex,
  Activity,
  Ckd,
  MalignantNeoplasm,
  RutherfordClassification,
} from '../models/patient-data';

export type BatchField =
  | 'caseId'
  | 'sex'
  | 'age'
  | 'heightCm'
  | 'weight'
  | 'alb'
  | 'activity'
  | 'hasCHF'
  | 'hasCVD'
  | 'ckd'
  | 'malignant'
  | 'hasAILesion'
  | 'hasFPLesion'
  | 'hasBKLesion'
  | 'isUrgent'
  | 'hasFever'
  | 'hasAbnormalWBC'
  | 'hasLocalInfection'
  | 'hasDyslipidemia'
  | 'isSmoking'
  | 'hasCAD'
  | 'hasContraLateralLesion'
  | 'hasOtherVD'
  | 'rutherford';

export const BATCH_FIELDS: readonly BatchField[] = [
  'caseId',
  'sex',
  'age',
  'heightCm',
  'weight',
  'alb',
  'activity',
  'hasCHF',
  'hasCVD',
  'ckd',
  'malignant',
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
  'rutherford',
];

export const BOOLEAN_FIELDS: readonly (keyof PatientData)[] = [
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
];

export interface BatchPatientInput {
  caseId: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weight: number;
  alb: number;
  activity: Activity;
  hasCHF: boolean;
  hasCVD: boolean;
  ckd: Ckd;
  malignant: MalignantNeoplasm;
  hasAILesion: boolean;
  hasFPLesion: boolean;
  hasBKLesion: boolean;
  isUrgent: boolean;
  hasFever: boolean;
  hasAbnormalWBC: boolean;
  hasLocalInfection: boolean;
  hasDyslipidemia: boolean;
  isSmoking: boolean;
  hasCAD: boolean;
  hasContraLateralLesion: boolean;
  hasOtherVD: boolean;
  rutherford: RutherfordClassification;
}

export const formatCaseId = (index: number): string => `CASE-${String(index + 1).padStart(4, '0')}`;
