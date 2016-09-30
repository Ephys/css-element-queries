import makeResizeDetector from 'element-resize-detector';
import type { ElemFeature } from '../types';
import { ATTRIBUTE_NAMES } from './ElementQueries';
import { convertToPx } from './CssUtil';

// TODO replace with native impl the day it comes into life.
// https://github.com/wnr/element-resize-detector
const resizeDetector = makeResizeDetector({
  strategy: 'scroll',
});

export default class ElementResizeHandler {
  /** @private */
  element: Element;

  /** @private */
  features: { [key: string]: ElemFeature } = {};

  onChange: (elem: Element) => void = null;
  changed = false;

  constructor(element: Element) {
    this.element = element;

    resizeDetector.listenTo(this.element, () => {
      this.refresh();
    });
  }

  addQueryFeature(feature: ElemFeature) {
    const idx = `${feature.prefix},${feature.name},${feature.value}`;
    this.features[idx] = feature;

    this.refresh();
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

    let changed = this.changed;
    for (const attribute of ATTRIBUTE_NAMES) {
      if (attributeValues[attribute]) {
        const newValue = attributeValues[attribute].join(',');

        if (!changed && this.element.getAttribute(attribute) !== newValue) {
          changed = true;
        }

        this.element.setAttribute(attribute, newValue);
      } else {
        if (!changed && this.element.hasAttribute(attribute)) {
          changed = true;
        }

        this.element.removeAttribute(attribute);
      }
    }

    if (changed) {
      if (this.onChange) {
        this.changed = false;
        this.onChange(this.element);
      } else {
        this.changed = true;
      }
    }
  }

  detach() {
    resizeDetector.uninstall(this.element);
  }
}
