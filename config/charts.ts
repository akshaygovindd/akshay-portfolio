/**
 * Tuned Random Forest feature importances for the Wildfire case study.
 * Source: WILDFIRE_FINAL.ipynb (Wildfire-Cause-Prediction), cell "feature importance", saved printed
 * output of `rf.feature_importances_`, rounded to 4 decimals. 12 features in the notebook; top 10 here.
 */
export const wildfireImportance = [
  { label: "longitude", value: 0.2674 },
  { label: "latitude", value: 0.1683 },
  { label: "Owner_Type", value: 0.0967 },
  { label: "Is_Drought_Season", value: 0.0864 },
  { label: "Region", value: 0.0849 },
  { label: "fire_year", value: 0.0641 },
  { label: "Season", value: 0.0609 },
  { label: "fire_size", value: 0.049 },
  { label: "response_time", value: 0.0415 },
  { label: "State_Fire_Rate", value: 0.0414 },
] as const;
