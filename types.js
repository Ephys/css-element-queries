export type DocumentLike = Document | DocumentFragment;
export type ErrorCallback = (error: Error, sheet: StyleSheet) => void;

export type ElemFeaturePrefix = 'min' | 'max';
export type ElemFeatureName = 'width' | 'height';

export type ElemFeature = {
  name: ElemFeatureName,
  prefix: ElemFeaturePrefix,
  value: string,
};
