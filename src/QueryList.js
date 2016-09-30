import type { ErrorCallback, QueryMode, QueryProperty } from '../types';
import { ATTRIBUTE_NAMES } from './ElementQueries';

// TODO code style => https://github.com/eslint/eslint/issues/3229
const SELECTOR_REGEX = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/mgi; // eslint-disable-line max-len
const SELECTOR_ATTRIBUTES_REGEX = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;

// TODO if a stylesheet is deleted, it should be removed from the cache.

export default class QueryList {

  onUnreadableSheet: ErrorCallback;

  /** @private */
  styleSheetCache: WeakSet<StyleSheet> = new WeakSet();

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

  extractQuery(selector: string) {
    selector = selector.replace(/'/g, '"');

    for (const match of matchAll(SELECTOR_REGEX, selector)) {
      const smatch = match[1] + match[3];
      const attrs = match[2];

      for (const attrMatch of matchAll(SELECTOR_ATTRIBUTES_REGEX, attrs)) {
        this.queueQuery(smatch, attrMatch[1], attrMatch[2], attrMatch[3]);
      }
    }
  }

  /**
   * @param {!string} selector - A CSS selector the element query should watch.
   * @param {!string} mode - min or max
   * @param {!string} property - height/width
   * @param {!string} propertyValue - length
   */
  queueQuery(selector, mode: QueryMode, property: QueryProperty, propertyValue) {
    const query = this.allQueries[mode] = this.allQueries[mode] || {};
    const queryMode = query[property] = query[property] || {};

    if (!queryMode[propertyValue]) {
      queryMode[propertyValue] = selector;
    } else {
      queryMode[propertyValue] += `, ${selector}`;
    }
  }

  [Symbol.iterator]() {

    // It would be nice to just use a generator here or implement a real lazy iterator
    // but the code is too complex and I don't want to add regenreator as a dependency to simplify it.
    const queries = [];

    for (const mode of Object.keys(this.allQueries)) {

      const properties = this.allQueries[mode];
      for (const property of Object.keys(properties)) {

        const values = properties[property];
        for (const value of Object.keys(values)) {
          const selector = values[value];
          const query = { mode, property, value, selector };

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
