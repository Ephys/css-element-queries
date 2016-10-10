import makeResizeDetector from 'element-resize-detector';
import type { ElemFeature } from '../types';
import { ATTRIBUTE_NAMES, resizeListener } from './ElementQueries';
import { convertToPx } from './CssUtil';
import { isDeadStyleSheet } from './domStyleSheets';

// TODO replace with native impl the day it comes into life.
// https://github.com/wnr/element-resize-detector
const resizeDetector = makeResizeDetector({
  strategy: 'scroll',
});

type ElemFeatureHolder = {
  feature: ElemFeature,
  styleSheets: Set<CSSStyleSheet>,
};

export default class ElementResizeHandler {
  /** @private */
  element: Element;

  /** @private */
  features: { [key: string]: ElemFeatureHolder } = {};

  onChange: (elem: Element) => void = null;
  changed = false;

  constructor(element: Element) {
    this.element = element;

    let timeout;
    resizeDetector.listenTo(this.element, () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        this.refresh();
        timeout = null;
      }, 40);
    });
  }

  /**
   * @param feature - The feature.
   * @param styleSheet - The style at the source fo this new element-feature.
   *                     Used to check if the styleSheet has been removed.
   */
  addQueryFeature(feature: ElemFeature, styleSheet: CSSStyleSheet) {
    if (!styleSheet) {
      throw new TypeError('Missing stylesheet');
    }

    const idx = `${feature.prefix}-${feature.name}=${feature.value}`;

    // console.log(styleSheet.cssRules[0].cssText);

    // if (styleSheet.__tagged) {
    //   console.log(styleSheet, styleSheet.ownerNode, Object.prototype.toString.call(styleSheet));
    // }

    let featureHolder: ElemFeatureHolder = this.features[idx];
    if (!featureHolder) {
      featureHolder = {
        feature,
        styleSheets: new Set(),
      };

      this.features[idx] = featureHolder;
    }

    featureHolder.styleSheets.add(styleSheet);

    this.refresh();
  }

  refresh() {
    const element = this.element;

    // extract current dimensions
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    const attributeValues: { [key: string] : string[] } = {};

    for (const featureKey of Object.keys(this.features)) {
      const elementFeatureHolder: ElemFeatureHolder = this.features[featureKey];

      if (!elementFeatureHolder) {
        continue;
      }

      if (isDead(elementFeatureHolder.styleSheets)) {
        this.features[featureKey] = void 0;
        continue;
      }

      this.parentNode = elementFeatureHolder.styleSheets.values().next().value.ownerNode;

      const elementFeature: ElemFeature = elementFeatureHolder.feature;

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

    if (Object.keys(this.features).length === 0) {
      this.detach();
    }
  }

  detach() {
    if (!this.element[resizeListener]) {
      return;
    }

    resizeDetector.uninstall(this.element);
    delete this.element[resizeListener];
  }
}

function isDead(sheets: Set<CSSStyleSheet>) {
  for (const sheet of sheets) {
    if (isDeadStyleSheet(sheet)) {
      sheets.delete(sheet);
    }
  }

  return sheets.size === 0;
}
