/**
 * All thresholds of the landform interpretation in one place. Starting values from the
 * specification; calibrate on real sheets (scripts/calibrate.ts). Lengths in metres.
 */
export const interpretConfig = {
  /** local relief model */
  lrm: { radiusM: 15 },

  /** what counts as a form at all */
  masks: {
    thresholdM: 0.25,
    /** opening radius in cells; 0 because 1–2.5 m firing pits are 1–3 cells at 1 m */
    openingCells: 0,
    minAreaM2: 2,
    maxAreaM2: 20_000,
    minHoleM2: 4,
    ringClosingCells: 2,
  },

  /** spoil heap around a pit: ring 1–4 m from the edge, 8 sectors of positive LRM */
  spoil: {
    ringFromM: 1,
    ringToM: 4,
    sectors: 8,
    /** a sector "has spoil" when its share of the strongest sector is at least this */
    sectorShareMin: 0.35,
    /** mean positive LRM in the ring below this: no spoil at all */
    minMeanM: 0.04,
    /** crater: completeness ≥ 0.75 */
    craterCompleteness: 0.75,
    /** uprooted tree: ≥ 60 % of the mass in 1–2 adjacent sectors and the mound touches the pit */
    windthrowMassShare: 0.6,
    touchM: 1.5,
    /** a convex component adjacent to a pit is its spoil when not more than this × the pit area */
    spoilAreaRatioMax: 4,
    /** a concave component next to a larger mound is a cut into the slope when below this × the mound */
    cutAreaRatioMax: 0.6,
    adjacencyM: 4,
  },

  /** bottom / top profile, depth measured against a plane fitted to the surroundings */
  profile: {
    planeRingFromM: 2,
    planeRingToM: 6,
    /** share of the area deeper than 80 % of the maximum */
    deepShareLevel: 0.8,
    flatBottomMin: 0.4,
    coneMax: 0.15,
    /** mound top: RMS of a plane fitted to the top / height; below = flat (platform), above = dome */
    flatTopRmsMax: 0.12,
  },

  /** dugout entrance: narrow notch at one side of the rectangle */
  entrance: { widthFromM: 0.8, widthToM: 1.5, minLengthM: 1.5 },

  /** horseshoe / ring walls around an inner area */
  ring: {
    /** inner area at least this share of the convex hull */
    innerShareMin: 0.2,
    /** sectors (of 8) with wall: 8 = closed, 5–7 = horseshoe */
    closedSectors: 8,
    horseshoeSectorsMin: 5,
  },

  /** linear forms */
  lines: {
    elongationMin: 4,
    /** resampling step of the axis and the window of the zigzag index */
    sampleStepM: 1,
    headingSegmentM: 5,
    zigzagTurnDeg: 30,
    /** turns > 30° per 10 m above this: zigzag (trench) */
    zigzagPer10mMin: 0.3,
    /** straight: tortuosity (path / chord) below this */
    straightTortuosityMax: 1.08,
    /** constant fall: share of monotonic steps and minimum gradient */
    monotonicShareMin: 0.85,
    minGradient: 0.002,
    /** parapet on one side when its LRM sum is ≥ this × the other side */
    parapetRatioMin: 2.5,
    parapetStripFromM: 1,
    parapetStripToM: 4,
    /** road: oblique to the slope */
    obliqueMinDeg: 20,
    obliqueMaxDeg: 70,
    parallelBandM: 20,
    /** U profile: share of the width with depth > 80 % of the max */
    uProfileMin: 0.3,
    steepRampGradient: 0.08,
  },

  /** groups of pits */
  groups: {
    /** regular spacing: coefficient of variation of nearest-neighbour distances */
    regularCvMax: 0.35,
    /** layout in a line: minor / major PCA eigenvalue */
    linearityMax: 0.15,
    /** spoil directions agree: circular variance */
    spoilCircularVarianceMax: 0.3,
    firingSpacingFromM: 4,
    firingSpacingToM: 15,
    firingMin: 3,
    campMin: 3,
    campRadiusM: 100,
    /** similar dimensions: coefficient of variation of the areas */
    campAreaCvMax: 0.35,
    campWaterM: 200,
    settlementMin: 4,
    settlementRadiusM: 150,
    barrowCemeteryMin: 3,
    barrowCemeteryRadiusM: 50,
  },

  /** parallel ridges (old fields): autocorrelation perpendicular to the ridges */
  fieldStrips: {
    windowM: 50,
    stepM: 25,
    periodFromM: 5,
    periodToM: 15,
    peakMin: 0.35,
    coherenceMin: 0.5,
    stdFromM: 0.03,
    stdToM: 0.2,
  },

  /** stream hollows detected in the DEM */
  water: { minWidthM: 6, minLengthM: 50 },

  /** size ranges of the interpretations (from the table) */
  sizes: {
    settlementFeatureM: [4, 15],
    cellarM: [2, 4],
    dugoutSideM: [3, 8],
    trenchWidthM: [0.8, 2.5],
    firingPitM: [1, 2.5],
    horseshoeM: [6, 15],
    craterM: [2, 12],
    roadWidthM: [2, 6],
    fieldRidgeHeightM: [0.1, 0.4],
    charcoalKilnM: [8, 15],
    pitM: [10, Infinity],
    barrowM: [8, 30],
    barrowMinHeightM: 0.4,
    hillfortM: [30, 200],
    windthrowM: [1.5, 5],
    naturalMinAreaM2: 600,
  },

  /** search zones and protected exclusion zones */
  zones: {
    settlementBufferM: 50,
    campBufferM: 30,
    campCorridorWidthM: 10,
    dugoutBufferM: 20,
    trenchStripFromM: 2,
    trenchStripToM: 10,
    trenchCircleM: 15,
    firingBufferM: 5,
    firingShiftM: 3,
    horseshoeOpenM: 10,
    smallBufferM: 5,
    roadBufferM: 10,
    roadCircleM: 30,
    barrowExclusionM: 20,
    hillfortExclusionM: 30,
    circleSegments: 24,
  },

  /** score = 40 × relief + 20 × confidence + 40 × context */
  score: {
    weights: { relief: 40, confidence: 20, context: 40 },
    reliefFullM: 1,
    contextMaxDistanceM: 300,
    roadBonus: 0.2,
    roadBonusDistanceM: 100,
    waterBonus: 0.2,
    waterBonusDistanceM: 200,
    priorityBumpContext: 0.6,
    fieldsNearSettlementM: 300,
  },
} as const;

export type InterpretConfig = typeof interpretConfig;
