import {
  Activity,
  Ckd,
  MalignantNeoplasm,
  PatientData,
  RutherfordClassification,
} from './patient-data';

export type OsRisk =
  | 'high' // risk < 50%
  | 'medium' // 50% <= risk < 70%
  | 'low'; // 70% <= risk

export type GnriRisk =
  | 'major' // gnri < 82
  | 'moderate' // 82 <= gnri < 92
  | 'low' // 92 <= gnri < 98
  | 'noRisk'; // 98 <= gnri

export type RiskErrorSource = 'NumberForm' | 'LesionChoice';

export class RiskCalculationError extends Error {
  constructor(
    message: string,
    readonly source: RiskErrorSource,
  ) {
    super(message);
    this.name = 'RiskCalculationError';
  }
}

export interface PatientRisk {
  gnri: number; // geriatric nutritional risk index
  gnriRisk: GnriRisk | null;
  predictedOS: number; // 2yr overall survival
  predictedAFS: number; // 2yr amputation free survival
  osRisk: OsRisk | null;
  predicted30DDeathOrAmputation: number;
  predicted30DMALE: number;
}

// Covariates for predictors.
// Age under 65, without CKD, ambulatory activity and
// no malignancy are set as reference.
type Covariate =
  | 'isFemale'
  | 'age65to74'
  | 'age75to84'
  | 'ageOver85'
  | 'hasCHF'
  | 'hasCVD'
  | 'hasCKDG3'
  | 'hasCKDG4'
  | 'hasCKDG5'
  | 'hasCKDG5D'
  | 'gnriNoOrLow'
  | 'gnriModerate'
  | 'gnriMajor'
  | 'activityAmbulatory'
  | 'activityWheelChair'
  | 'activityImmobile'
  | 'pastMalignancy'
  | 'treatingMalignancy'
  | 'isUrgent'
  | 'fever'
  | 'abnormalWBC'
  | 'localInfection'
  | 'hasCAD'
  | 'isSmoking'
  | 'hasDislipidemia'
  | 'hasNoAIlesion'
  | 'hasNoFPlesion'
  | 'lesionFP'
  | 'lesionBelowIP'
  | 'hasNoContralateral'
  | 'hasOther'
  | 'rutherford4'
  | 'rutherford5'
  | 'rutherford6'
  | 'intercept';

type CoeffMap = Partial<Record<Covariate, number>>;

const OS_H0_COEFF = 0.922;

const OS_COEFF: CoeffMap = {
  isFemale: -0.25,
  age65to74: 0.31,
  age75to84: 0.76,
  ageOver85: 1.04,
  hasCHF: 0.5,
  hasCVD: 0.0,
  hasCKDG3: 0.27,
  hasCKDG4: 0.61,
  hasCKDG5: 0.76,
  hasCKDG5D: 1.01, // HD
  gnriModerate: 0.14,
  gnriMajor: 0.52,
  activityWheelChair: 0.28,
  activityImmobile: 0.77,
  pastMalignancy: 0.2,
  treatingMalignancy: 0.56,
  lesionFP: -0.07,
  lesionBelowIP: 0.16,
};

const AFS_H0_COEFF = 0.876;

const AFS_COEFF: CoeffMap = {
  isFemale: -0.21,
  age65to74: 0.19,
  age75to84: 0.42,
  ageOver85: 0.62,
  hasCHF: 0.41,
  hasCVD: 0.1,
  hasCKDG3: 0.16,
  hasCKDG4: 0.36,
  hasCKDG5: 0.73,
  hasCKDG5D: 0.81, // HD
  gnriModerate: 0.09,
  gnriMajor: 0.45,
  activityWheelChair: 0.37,
  activityImmobile: 0.78,
  pastMalignancy: 0.15,
  treatingMalignancy: 0.39,
  isUrgent: 0.34,
  fever: 0.36,
  abnormalWBC: 0.19,
  localInfection: 0.15,
  lesionFP: -0.07,
  lesionBelowIP: 0.15,
};

const SHORT_DEATH_OR_AMPUTATION_COEFF: CoeffMap = {
  intercept: 2.86452,
  abnormalWBC: -0.59896,
  isUrgent: -0.64861,
  hasCHF: -0.39326,
  fever: -0.3888,
  hasCKDG5D: -0.33797,
  hasNoAIlesion: -0.14474,
  hasCVD: -0.05239,
  hasDislipidemia: 0.05969,
  rutherford5: 0.12638,
  hasNoFPlesion: 0.17229,
  gnriModerate: 0.36795,
  activityAmbulatory: 0.54391,
  gnriNoOrLow: 0.76479,
};

const SHORT_MALE_COEFF: CoeffMap = {
  intercept: 2.2575,
  abnormalWBC: -0.50671,
  fever: -0.33461,
  localInfection: -0.28088,
  rutherford6: -0.26513,
  activityWheelChair: -0.22555,
  isUrgent: -0.20964,
  hasCHF: -0.09218,
  hasCKDG5D: -0.02024,
  hasCVD: 0.01592,
  hasOther: 0.02649,
  isSmoking: 0.03109,
  hasCAD: 0.0375,
  rutherford5: 0.14299,
  age75to84: 0.16816,
  activityAmbulatory: 0.17103,
  hasNoContralateral: 0.18822,
  hasNoFPlesion: 0.21082,
  hasDislipidemia: 0.2189,
  isFemale: 0.24023,
  gnriNoOrLow: 0.32693,
  ageOver85: 0.46026,
  gnriModerate: 0.46838,
};

export function calculatePatientRisk(data: PatientData): PatientRisk {
  if (data.weight === null || data.height === null || data.age === null || data.alb === null) {
    throw new RiskCalculationError('form is empty', 'NumberForm');
  }
  if (!data.hasAILesion && !data.hasFPLesion && !data.hasBKLesion) {
    throw new RiskCalculationError('wrong lesion choice', 'LesionChoice');
  }

  const gnri = calcGnri(data);
  const gnriRisk = classifyGnriRisk(gnri);
  const predictedOS = Math.pow(OS_H0_COEFF, Math.exp(calcSigma(data, gnriRisk, OS_COEFF)));
  const predictedAFS = Math.pow(AFS_H0_COEFF, Math.exp(calcSigma(data, gnriRisk, AFS_COEFF)));
  const predicted30DDeathOrAmputation =
    1.0 / (1.0 + Math.exp(calcSigma(data, gnriRisk, SHORT_DEATH_OR_AMPUTATION_COEFF)));
  const predicted30DMALE = 1.0 / (1.0 + Math.exp(calcSigma(data, gnriRisk, SHORT_MALE_COEFF)));

  return {
    gnri,
    gnriRisk,
    predictedOS,
    predictedAFS,
    osRisk: classifyOsRisk(predictedOS),
    predicted30DDeathOrAmputation,
    predicted30DMALE,
  };
}

// --- Covariate selection ---------------------------------------------------
// Each patient attribute is mapped to the covariate it activates.
// `null` means the value is the reference category and adds no covariate.

const AGE_COVARIATES: readonly (readonly [number, Covariate])[] = [
  [85, 'ageOver85'],
  [75, 'age75to84'],
  [65, 'age65to74'],
  // under 65 is the reference
];

const CKD_COVARIATE: Record<Ckd, Covariate | null> = {
  normal: null,
  g3: 'hasCKDG3',
  g4: 'hasCKDG4',
  g5: 'hasCKDG5',
  g5D: 'hasCKDG5D', // HD
};

const GNRI_COVARIATE: Record<GnriRisk, Covariate> = {
  noRisk: 'gnriNoOrLow',
  low: 'gnriNoOrLow',
  moderate: 'gnriModerate',
  major: 'gnriMajor',
};

const ACTIVITY_COVARIATE: Record<Activity, Covariate> = {
  ambulatory: 'activityAmbulatory',
  wheelchair: 'activityWheelChair',
  immobile: 'activityImmobile',
};

const MALIGNANT_COVARIATE: Record<MalignantNeoplasm, Covariate | null> = {
  no: null,
  pastHistory: 'pastMalignancy',
  underTreatment: 'treatingMalignancy',
};

const RUTHERFORD_COVARIATE: Record<RutherfordClassification, Covariate> = {
  class4: 'rutherford4',
  class5: 'rutherford5',
  class6: 'rutherford6',
};

// Covariates activated by a boolean condition on the patient data.
//
// occlusive lesion
// EJVES occlusive classification
// | AI | FP | BK | 2yr occlusive lesion
// | +  | +- | +- | AI
// | -  | +  | +- | FP without AI
// | -  | -  | +  | Below IP
// | -  | -  | -  | undefined
const FLAG_COVARIATES: Partial<Record<Covariate, (data: PatientData) => boolean>> = {
  isFemale: (d) => d.sex === 'female',
  hasCHF: (d) => d.hasCHF,
  hasCVD: (d) => d.hasCVD,
  // 30 days
  hasNoAIlesion: (d) => !d.hasAILesion,
  hasNoFPlesion: (d) => !d.hasFPLesion,
  // 2yr
  lesionFP: (d) => !d.hasAILesion && d.hasFPLesion,
  lesionBelowIP: (d) => !d.hasAILesion && !d.hasFPLesion && d.hasBKLesion,
  isUrgent: (d) => d.isUrgent,
  fever: (d) => d.hasFever,
  abnormalWBC: (d) => d.hasAbnormalWBC,
  localInfection: (d) => d.hasLocalInfection,
  hasCAD: (d) => d.hasCAD,
  isSmoking: (d) => d.isSmoking,
  hasDislipidemia: (d) => d.hasDyslipidemia,
  hasNoContralateral: (d) => !d.hasContraLateralLesion,
  hasOther: (d) => d.hasOtherVD,
};

const FLAG_COVARIATE_ENTRIES = Object.entries(FLAG_COVARIATES) as readonly [
  Covariate,
  (data: PatientData) => boolean,
][];

const GNRI_RISK_THRESHOLDS: readonly (readonly [number, GnriRisk])[] = [
  [98, 'noRisk'],
  [92, 'low'],
  [82, 'moderate'],
  [Number.NEGATIVE_INFINITY, 'major'],
];

const OS_RISK_THRESHOLDS: readonly (readonly [number, OsRisk])[] = [
  [0.7, 'low'],
  [0.5, 'medium'],
  [Number.NEGATIVE_INFINITY, 'high'],
];

// Returns the first entry whose lower bound the value reaches,
// or null when the value is NaN or below every bound.
function classifyByThreshold<T>(
  value: number,
  thresholds: readonly (readonly [number, T])[],
): T | null {
  if (Number.isNaN(value)) return null;
  return thresholds.find(([lowerBound]) => value >= lowerBound)?.[1] ?? null;
}

function calcGnri(data: PatientData): number {
  if (data.height === 0.0) return NaN;
  let wi = data.weight! / (22.0 * Math.pow(data.height!, 2));
  if (wi >= 1.0) wi = 1.0;
  return 14.89 * data.alb! + 41.7 * wi;
}

function classifyGnriRisk(gnri: number): GnriRisk | null {
  return classifyByThreshold(gnri, GNRI_RISK_THRESHOLDS);
}

function classifyOsRisk(overallSurvival: number): OsRisk | null {
  return classifyByThreshold(overallSurvival, OS_RISK_THRESHOLDS);
}

function selectCovariates(data: PatientData, gnriRisk: GnriRisk): Covariate[] {
  const selected: (Covariate | null)[] = [
    classifyByThreshold(data.age!, AGE_COVARIATES),
    CKD_COVARIATE[data.ckd],
    GNRI_COVARIATE[gnriRisk],
    ACTIVITY_COVARIATE[data.activity],
    MALIGNANT_COVARIATE[data.malignant],
    RUTHERFORD_COVARIATE[data.rutherford],
    ...FLAG_COVARIATE_ENTRIES.filter(([, isActive]) => isActive(data)).map(
      ([covariate]) => covariate,
    ),
    'intercept',
  ];
  return selected.filter((covariate) => covariate !== null);
}

function calcSigma(data: PatientData, gnriRisk: GnriRisk | null, coeff: CoeffMap): number {
  // if GNRI could not be calculated, the whole predictor is undefined
  if (gnriRisk === null) return NaN;

  return selectCovariates(data, gnriRisk).reduce(
    (sigma, covariate) => sigma + (coeff[covariate] ?? 0.0),
    0.0,
  );
}
