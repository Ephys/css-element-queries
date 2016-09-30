import makeResizeDetector from 'element-resize-detector';
import type { ElemFeature } from '../types';
import { ATTRIBUTE_NAMES } from './ElementQueries';
import { convertToPx } from './CssUtil';

const resizeDetector = makeResizeDetector();

export default class ElementResizeHandler {
  /** @private */
  element: Element;

  /** @private */
  features: { [key: string]: ElemFeature } = {};

  constructor(element: Element) {
    this.element = element;

    resizeDetector.listenTo(this.element, () => this.refresh());
  }

  addQueryFeature(feature: ElemFeature) {
    const idx = `${feature.prefix},${feature.name},${feature.value}`;
    this.features[idx] = feature;
  }

  refresh() {
    const element = this.element;

    // extract current dimensions
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    const attributeValues: { [key: string] : string[] } = {};

    for (const featureKey of Object.keys(this.features)) {
      const elementFeature: ElemFeature = this.features[featureKey];

      const targetSize = convertToPx(this.element, elementFeature.value);
      const currentSize = elementFeature.name === 'width' ? width : height;

      const attributeName = `${elementFeature.prefix}-${elementFeature.name}`;

      let attributeValue;
      switch (elementFeature.prefix) {
        case 'min':
          if (currentSize >= targetSize) {
            attributeValue = elementFeature.value;
          }

          break;

        case 'max':
          if (currentSize <= targetSize) {
            attributeValue = elementFeature.value;
          }

          break;

        default:
          throw new Error(`Invalid Element Query Prefix ${elementFeature.prefix}`);
      }

      if (attributeValue) {
        if (!attributeValues[attributeName]) {
          attributeValues[attributeName] = [attributeValue];
        } else if (attributeValues[attributeName].indexOf(attributeValue) === -1) {
          attributeValues[attributeName].push(attributeValue);
        }
      }
    }

    for (const attribute of ATTRIBUTE_NAMES) {
      if (attributeValues[attribute]) {
        this.element.setAttribute(attribute, attributeValues[attribute].join(','));
      } else {
        this.element.removeAttribute(attribute);
      }
    }
  }

  detach() {
    resizeDetector.uninstall(this.element);
  }
}
