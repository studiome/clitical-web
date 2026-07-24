export type Sex = 'male' | 'female';

export type Activity = 'ambulatory' | 'wheelchair' | 'immobile';

export type Ckd = 'normal' | 'g3' | 'g4' | 'g5' | 'g5D';

export type MalignantNeoplasm = 'no' | 'pastHistory' | 'underTreatment';

export type RutherfordClassification = 'class4' | 'class5' | 'class6';

export interface PatientData {
  // basic info
  sex: Sex;
  age: number | null; // years
  weight: number | null; // kg
  height: number | null; // m
  alb: number | null; // albumin g/dl
  activity: Activity;

  // clinical info
  hasCHF: boolean; // congestive heart failure
  hasCVD: boolean; // cerebral vascular disease
  ckd: Ckd; // chronic kidney disease classification
  malignant: MalignantNeoplasm; // malignant neoplasm

  // arterial occlusive lesion: Aorto-Iliac, Femoro-Popliteal, below knee
  hasAILesion: boolean;
  hasFPLesion: boolean;
  hasBKLesion: boolean;

  isUrgent: boolean; // urgent procedure
  hasFever: boolean; // BT over 38 deg celsius
  hasAbnormalWBC: boolean; // WBC over 8000/ul
  hasLocalInfection: boolean;
  hasDyslipidemia: boolean; // high LDL-C or TG
  isSmoking: boolean;
  hasCAD: boolean; // coronary artery disease
  hasContraLateralLesion: boolean; // contralateral limb arterial lesions
  hasOtherVD: boolean; // other vascular lesions except contralateral limb

  rutherford: RutherfordClassification; // Rutherford classification 4, 5, 6
}

export function createPatientData(): PatientData {
  return {
    sex: 'female',
    age: null,
    weight: null,
    height: null,
    alb: null,
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
}
