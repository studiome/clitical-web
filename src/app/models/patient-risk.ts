import { PatientData } from './patient-data';

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
  if (
    data.weight === null ||
    data.height === null ||
    data.age === null ||
    data.alb === null
  ) {
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
  const predicted30DMALE =
    1.0 / (1.0 + Math.exp(calcSigma(data, gnriRisk, SHORT_MALE_COEFF)));

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

function calcGnri(data: PatientData): number {
  if (data.height === 0.0) return NaN;
  let wi = data.weight! / (22.0 * Math.pow(data.height!, 2));
  if (wi >= 1.0) wi = 1.0;
  return 14.89 * data.alb! + 41.7 * wi;
}

function classifyGnriRisk(gnri: number): GnriRisk | null {
  if (Number.isNaN(gnri)) return null;
  if (gnri >= 98) return 'noRisk';
  if (gnri >= 92) return 'low';
  if (gnri >= 82) return 'moderate';
  return 'major';
}

function classifyOsRisk(overallSurvival: number): OsRisk | null {
  if (Number.isNaN(overallSurvival)) return null;
  if (overallSurvival >= 0.7) return 'low';
  if (overallSurvival >= 0.5) return 'medium';
  return 'high';
}

function calcSigma(
  data: PatientData,
  gnriRisk: GnriRisk | null,
  coeff: CoeffMap,
): number {
  let sigma = 0.0;

  if (data.sex === 'female') sigma += coeff.isFemale ?? 0.0;

  if (data.age! >= 85) {
    sigma += coeff.ageOver85 ?? 0.0;
  } else if (data.age! >= 75) {
    sigma += coeff.age75to84 ?? 0.0;
  } else if (data.age! >= 65) {
    sigma += coeff.age65to74 ?? 0.0;
  }

  if (data.hasCHF) sigma += coeff.hasCHF ?? 0.0;
  if (data.hasCVD) sigma += coeff.hasCVD ?? 0.0;

  switch (data.ckd) {
    case 'g3':
      sigma += coeff.hasCKDG3 ?? 0.0;
      break;
    case 'g4':
      sigma += coeff.hasCKDG4 ?? 0.0;
      break;
    case 'g5':
      sigma += coeff.hasCKDG5 ?? 0.0;
      break;
    case 'g5D':
      sigma += coeff.hasCKDG5D ?? 0.0;
      break;
    default:
      break;
  }

  // if GNRI could not be calculated, the whole predictor is undefined
  if (gnriRisk === null) return NaN;

  switch (gnriRisk) {
    case 'noRisk':
    case 'low':
      sigma += coeff.gnriNoOrLow ?? 0.0;
      break;
    case 'moderate':
      sigma += coeff.gnriModerate ?? 0.0;
      break;
    case 'major':
      sigma += coeff.gnriMajor ?? 0.0;
      break;
  }

  switch (data.activity) {
    case 'ambulatory':
      sigma += coeff.activityAmbulatory ?? 0.0;
      break;
    case 'wheelchair':
      sigma += coeff.activityWheelChair ?? 0.0;
      break;
    case 'immobile':
      sigma += coeff.activityImmobile ?? 0.0;
      break;
  }

  switch (data.malignant) {
    case 'pastHistory':
      sigma += coeff.pastMalignancy ?? 0.0;
      break;
    case 'underTreatment':
      sigma += coeff.treatingMalignancy ?? 0.0;
      break;
    default:
      break;
  }

  // occlusive lesion
  // EJVES occlusive classification
  // | AI | FP | BK | 2yr occlusive lesion
  // | +  | +- | +- | AI
  // | -  | +  | +- | FP without AI
  // | -  | -  | +  | Below IP
  // | -  | -  | -  | undefined
  //
  // 30 days
  if (!data.hasAILesion) sigma += coeff.hasNoAIlesion ?? 0.0;
  if (!data.hasFPLesion) sigma += coeff.hasNoFPlesion ?? 0.0;

  // 2yr
  if (!data.hasAILesion) {
    if (data.hasFPLesion) {
      sigma += coeff.lesionFP ?? 0.0;
    } else if (data.hasBKLesion) {
      sigma += coeff.lesionBelowIP ?? 0.0;
    }
  }

  if (data.isUrgent) sigma += coeff.isUrgent ?? 0.0;
  if (data.hasFever) sigma += coeff.fever ?? 0.0;
  if (data.hasAbnormalWBC) sigma += coeff.abnormalWBC ?? 0.0;
  if (data.hasLocalInfection) sigma += coeff.localInfection ?? 0.0;
  if (data.hasCAD) sigma += coeff.hasCAD ?? 0.0;
  if (data.isSmoking) sigma += coeff.isSmoking ?? 0.0;
  if (data.hasDyslipidemia) sigma += coeff.hasDislipidemia ?? 0.0;
  if (!data.hasContraLateralLesion) sigma += coeff.hasNoContralateral ?? 0.0;
  if (data.hasOtherVD) sigma += coeff.hasOther ?? 0.0;

  switch (data.rutherford) {
    case 'class4':
      sigma += coeff.rutherford4 ?? 0.0;
      break;
    case 'class5':
      sigma += coeff.rutherford5 ?? 0.0;
      break;
    case 'class6':
      sigma += coeff.rutherford6 ?? 0.0;
      break;
  }

  sigma += coeff.intercept ?? 0.0;

  return sigma;
}
