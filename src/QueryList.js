import type { ErrorCallback, ElemFeaturePrefix, ElemFeatureName } from '../types';
import { ATTRIBUTE_NAMES } from './ElementQueries';

// TODO code style => https://github.com/eslint/eslint/issues/3229
const SELECTOR_REGEX = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/mgi; // eslint-disable-line max-len
const SELECTOR_ATTRIBUTES_REGEX = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;

// TODO if a stylesheet is deleted, it should be removed from the cache.

export default class QueryList {

  /** @private */
  onUnreadableSheet: ErrorCallback;

  /** @private */
  styleSheetCache: WeakSet<StyleSheet> = new WeakSet();

  /** @private */
  allQueries: string[] = [];

  constructor(onUnreadableSheet: ErrorCallback) {
    this.onUnreadableSheet = onUnreadableSheet;
  }

  readStyleSheet(styleSheet: CSSStyleSheet | CSSGroupingRule) {
    if (this.styleSheetCache.has(styleSheet)) {
      return;
    }

    try {
      const rules: CSSRuleList = styleSheet.cssRules || styleSheet.rules;

      for (let i = 0, j = rules.length; i < j; i++) {
        const rule = rules[i];

        switch (rule.type) {
          case CSSRule.STYLE_RULE:
            return this.readSelector(rule);

          case CSSRule.IMPORT_RULE:
            return this.readStyleSheets(rule.styleSheet);

          case CSSRule.MEDIA_RULE:
            return this.readStyleSheets(rule);

          default:
        }
      }

      this.styleSheetCache.add(styleSheet);
    } catch (e) {
      // ignore InvalidAccessError, styleSheet is not fully loaded yet.
      if (e.name !== 'InvalidAccessError') {
        this.styleSheetCache.add(styleSheet);
        this.onUnreadableSheet(e, styleSheet);
      }
    }
  }

  readSelector(rule: CSSStyleRule) {
    const selector = rule.selectorText;

    if (!hasElementQuery(selector)) {
      return;
    }

    this.extractQuery(selector);
  }

  extractQuery(rawSelector: string) {
    rawSelector = rawSelector.replace(/'/g, '"');

    for (const match of matchAll(SELECTOR_REGEX, rawSelector)) {
      const featureSelector = match[1] + match[3];
      const rawElementFeature = match[2];

      for (const attrMatch of matchAll(SELECTOR_ATTRIBUTES_REGEX, rawElementFeature)) {
        this.queueQuery(featureSelector, attrMatch[1], attrMatch[2], attrMatch[3]);
      }
    }
  }

  /**
   * @param {!string} selector - A CSS selector the element query should watch.
   * @param {!string} featurePrefix - A prefix for the element feature.
   * @param {!string} elemFeature - The name of the element feature.
   * @param {!string} featureValue - element feature value.
   */
  queueQuery(selector: string, featurePrefix: ElemFeaturePrefix, elemFeature: ElemFeatureName, featureValue) {
    const query = this.allQueries[featurePrefix] = this.allQueries[featurePrefix] || {};
    const queryMode = query[elemFeature] = query[elemFeature] || {};

    if (!queryMode[featureValue]) {
      queryMode[featureValue] = selector;
    } else {
      queryMode[featureValue] += `, ${selector}`;
    }
  }

  [Symbol.iterator]() {

    // It would be nice to just use a generator here or implement a real lazy iterator
    // but the code is too complex and I don't want to add regenreator as a dependency to simplify it.
    const queries = [];

    for (const featurePrefix of Object.keys(this.allQueries)) {

      const featureNames = this.allQueries[featurePrefix];
      for (const featureName of Object.keys(featureNames)) {

        const featureValues = featureNames[featureName];
        for (const featureValue of Object.keys(featureValues)) {
          const selector = featureValues[featureValue];
          const query = {
            selector,
            feature: {
              name: featureName,
              prefix: featurePrefix,
              value: featureValue,
            },
          };

          queries.push(query);
        }
      }
    }

    return queries[Symbol.iterator];
  }
}

function hasElementQuery(selector: string) {
  for (const attributeName of ATTRIBUTE_NAMES) {
    if (selector.indexOf(attributeName) !== -1) {
      return true;
    }
  }

  return false;
}

function *matchAll(regex: RegExp, str: string) {
  let attrMatch;
  while (null !== (attrMatch = regex.exec(str))) { // eslint-disable-line
    yield attrMatch;
  }
}
