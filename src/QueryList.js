import type { ErrorCallback } from '../types';

const ATTRIBUTE_NAMES = ['min-width', 'min-height', 'max-width', 'max-height'];

const SELECTOR_REGEX = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/mgi;
const SELECTOR_ATTRIBUTES_REGEX = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;

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
        this.onUnreadableSheet(e);
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

  queueQuery(selector, mode, property, value) {
    const query = this.allQueries[mode] = this.allQueries[mode] || {};
    const queryMode = query[property] = query[property] || {};

    if (!queryMode[value]) {
      queryMode[value] = selector;
    } else {
      queryMode[value] += `, ${selector}`;
    }
  }
}

function hasElementQuery(selector: string) {
  for (const attributeName of ATTRIBUTE_NAMES) {
    if (selector.indexOf(attributeName) !== -1) {
      return true;
    }

    return false;
  }
}

function *matchAll(regex: RegExp, str: string) {
  let attrMatch;
  while (null !== (attrMatch = regex.exec(str))) { // eslint-disable-line
    yield attrMatch;
  }
}
