import makeResizeDetector from 'element-resize-detector';
import type { ElemFeature } from '../types';
import { ATTRIBUTE_NAMES } from './ElementQueries';
import { convertToPx } from './CssUtil';

const resizeDetector = makeResizeDetector();

export default class ElementResizeHandler {
  /** @private */
  element: Node;

  /** @private */
  features: { [key: string]: ElemFeature } = {};

  constructor(element) {
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

    const attrValues = {};

    for (const featureKey of Object.keys(this.features)) {
      const elementFeature: ElemFeature = this.features[featureKey];
      const targetSize = convertToPx(this.element, elementFeature.value);

      const currentValue = elementFeature.name === 'width' ? width : height;
      attrName = elementFeature.mode + '-' + elementFeature.property;
      attrValue = '';

      if (elementFeature.mode == 'min' && actualValue >= targetSize) {
        attrValue += elementFeature.value;
      }

      if (elementFeature.mode == 'max' && actualValue <= targetSize) {
        attrValue += elementFeature.value;
      }

      if (!attrValues[attrName]) attrValues[attrName] = '';
      if (attrValue && -1 === (' ' + attrValues[attrName] + ' ').indexOf(' ' + attrValue + ' ')) {
        attrValues[attrName] += ' ' + attrValue;
      }
    }

    for (const attribute of ATTRIBUTE_NAMES) {

    }

    for (var k in attributes) {
      if (!attributes.hasOwnProperty(k)) continue;

      if (attrValues[attributes[k]]) {
        this.element.setAttribute(attributes[k], attrValues[attributes[k]].substr(1));
      } else {
        this.element.removeAttribute(attributes[k]);
      }
    }
  }

  detach() {
    resizeDetector.uninstall(this.element);
  }
}
