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
    /**
     * strongest sector's mean positive LRM below this: no spoil at all. The LRM halo of nearby
     * pits reaches ~0.05 m, so real spoil (crater rims, root plates: 0.2–0.4 m) starts above 0.1.
     */
    minMeanM: 0.1,
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
    /** calibration: dunes and field corners read as hillforts; a hillfort ring encloses a large inside */
    hillfortInnerShareMin: 0.4,
    /** hull area / circle of the same length: round enough */
    hillfortRoundnessMin: 0.6,
    /** calibration: irregular blobs looked like horseshoes; a wall stands above its inside */
    wallAboveInnerM: 0.2,
    wallMinHeightM: 0.3,
  },

  /** linear forms */
  lines: {
    elongationMin: 4,
    /** shorter elongated bits are not lines (calibration: 3–4 m scraps were read as trenches) */
    minLengthM: 15,
    /** resampling step of the axis and the window of the zigzag index */
    sampleStepM: 1,
    headingSegmentM: 5,
    zigzagTurnDeg: 30,
    /**
     * turns > 30° per 10 m above this: zigzag. A trench needs it: on real sheets a straight
     * ditch with a bank on one side was always a roadside ditch, never a trench.
     */
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
    /** calibration: noise pits and field drains merged into 'settlements' */
    settlementHousesMin: 3,
    settlementLinkM: 40,
    houseMinDepthM: 0.4,
    cellarNearHouseM: 30,
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
    /** calibration: an elongated bank along a road read as a kiln platform */
    charcoalKilnMinCircularity: 0.7,
    pitM: [10, Infinity],
    barrowM: [8, 30],
    barrowMinHeightM: 0.4,
    /** calibration: broad low swells in fields are natural; a barrow is at least 4 % as high as wide */
    barrowMinHeightRatio: 0.04,
    barrowMinCircularity: 0.75,
    /** ground 2–6 m outside a barrow is flat (synthetic barrow 0.01, broad swell 0.13) */
    barrowMaxFlankShare: 0.08,
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
    /**
     * how far an archival object still lends context (closeness 1 at the object → 0 here).
     * A village spreads its traces wider than a ford; unknown kinds use contextMaxDistanceM.
     */
    contextKindRadiusM: {
      osada: 400,
      mlyn: 300,
      karczma: 300,
      brod: 200,
      droga: 150,
      inne: 200,
      // positions and trenches: also the reach of the UXO warning
      wojsko: 300,
      // war graves lend no context; this is only the reach of the war-graves warning
      grob_wojenny: 150,
    },
    /** a candidate this close to a war grave from a map is protected (never a search target) */
    warGraveProtectM: 50,
  },
} as const;

export type InterpretConfig = typeof interpretConfig;
