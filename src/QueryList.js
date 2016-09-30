import type { ErrorCallback, ElemFeaturePrefix, ElemFeatureName } from '../types';
import { ATTRIBUTE_NAMES } from './ElementQueries';
import { domStyleSheets, isDeadStyleSheet } from './domStyleSheets';

// TODO code style => https://github.com/eslint/eslint/issues/3229
const SELECTOR_REGEX = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/mgi; // eslint-disable-line max-len
const SELECTOR_ATTRIBUTES_REGEX = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;

// TODO if a stylesheet is deleted, it should be removed from the cache.

type Query = {
  selectors: {
    selector: string,
    styleSheet: StyleSheet,
  }[],
  feature: ElemFeature,
};

export default class QueryList {

  /** @private */
  onUnreadableSheet: ErrorCallback;

  /** @private */
  styleSheetCache: WeakSet<StyleSheet> = new WeakSet();

  /** @private */
  allQueries: Map<string, Query> = new Map();

  constructor(onUnreadableSheet: ErrorCallback) {
    this.onUnreadableSheet = onUnreadableSheet;
  }

  addStyleSheet(styleSheet: CSSStyleSheet) {
    if (this.styleSheetCache.has(styleSheet)) {
      return;
    }

    this.readStyleSheet(styleSheet);
  }

  /** @private */
  readStyleSheet(styleSheet: CSSStyleSheet | CSSGroupingRule) {
    try {
      const rules: CSSRuleList = styleSheet.cssRules || styleSheet.rules;

      for (let i = 0, j = rules.length; i < j; i++) {
        const rule = rules[i];

        switch (rule.type) {
          case CSSRule.STYLE_RULE:
            this.readSelector(rule);
            break;

          case CSSRule.IMPORT_RULE:
            this.readStyleSheet(rule.styleSheet);
            break;

          case CSSRule.MEDIA_RULE:
            this.readStyleSheet(rule);
            break;

          default:
        }
      }

      this.markAsRead(styleSheet);
    } catch (e) {
      // ignore InvalidAccessError, styleSheet is not fully loaded yet.
      if (e.name !== 'InvalidAccessError') {
        this.markAsRead(styleSheet);
        this.onUnreadableSheet(e, styleSheet);
      }
    }
  }

  markAsRead(styleSheet: CSSStyleSheet) {
    this.styleSheetCache.add(styleSheet);
    if (styleSheet.ownerNode) {
      domStyleSheets.add(styleSheet);
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
   * @param {!CSSStyleSheet} styleSheet - The StyleSheet which added this rule.
   */
  queueQuery(selector: string, featurePrefix: ElemFeaturePrefix,
             elemFeature: ElemFeatureName, featureValue, styleSheet: CSSStyleSheet) {

    const queryIdentifier = `${featurePrefix}-${elemFeature}-${featureValue}`;

    let query;
    if (this.allQueries.has(queryIdentifier)) {
      query = this.allQueries.get(queryIdentifier);
    } else {
      query = {
        selectors: [],
        feature: {
          name: elemFeature,
          prefix: featurePrefix,
          value: featureValue,
        },
      };
    }

    query.selectors.push({ styleSheet, selector });
  }

  [Symbol.iterator]() {
    const allQueries = this.allQueries;

    const iterator = allQueries.values();
    const toRemove = [];

    return {
      next() {
        do {
          const newValue = iterator.next();
          if (newValue.done) {
            for (const item of toRemove) {
              allQueries.delete(item);
            }

            return newValue;
          }

          const val: Query = newValue.value;
          if (val.selectors.find(item => isDeadStyleSheet(item.styleSheet)) != null) {
            val.selectors = val.selectors.filter(item => isDeadStyleSheet(item.styleSheet));
          }

          if (val.selectors.length !== 0) {
            return newValue;
          }

          toRemove.push(val); // no more selectors, delete this!
        } while (true);
      },
    };
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
