/**
 * @author Marc J. Schmidt, Guylian Cox
 * @license MIT
 * @description Based on https://github.com/marcj/css-element-queries
 * @preserve
 *
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
import type { DocumentLike, ErrorCallback } from '../types';
import { convertToPx } from './CssUtil';
import QueryList from './QueryList';

/*
 * TODO
 * - Take disabled sheets into account
 * - add a possibility to watch nodes with MutationObserver
 * - MUSt detect detached roots and removed element query from them.
 */

export class ElementQueries {

  static instances: WeakMap<DocumentLike, ElementQueries> = new WeakMap();

  /** @readonly */
  watchedDoc: DocumentLike;

  /** @private */
  queryList: QueryList;

  manualUpdate: boolean;

  constructor(doc: DocumentLike = window.document, {
    onUnreadableSheet = noop,
    manualUpdate = false,
  } : {
    onUnreadableSheet: ErrorCallback,
    manualUpdate: boolean,
  } = {}) {
    this.watchedDoc = doc;
    this.queryList = new QueryList(onUnreadableSheet);
    this.onUnreadableSheet = onUnreadableSheet;
    this.manualUpdate = manualUpdate;

    if (!this.manualUpdate) {
      this.update();
    }
  }

  /**
   * Read new styleSheets then search the dom for element query elements.
   */
  update() {
    this.readStyleSheets();

    if (this.manualUpdate) {
      this.readDom();
    }
  }

  /**
   * Reads style sheets that haven't been read so far to extract element query queries.
   * If the manualUpdate option is true, the dom will be re-read.
   */
  readStyleSheets() {
    for (const styleSheet: CSSStyleSheet of this.watchedDoc.styleSheets) {
      this.queryList.readStyleSheet(styleSheet);
    }

    if (!this.manualUpdate) {
      this.readDom();
    }
  }

  /**
   * Read a specific style sheet.
   *
   * If the manualUpdate option is true, the dom will be re-read.
   * Note: the stylesheet will be ignored if it has already been read.
   */
  readStyleSheet(styleSheet) {
    this.queryList.readStyleSheet(styleSheet);

    if (!this.manualUpdate) {
      this.readDom();
    }
  }

  /**
   * Search the dom tree for an element whose selector matches an element query one.
   */
  readDom(tree = this.watchedDoc) {
    const root = getRootNode(tree);
    if (root !== this.watchedDoc) {
      throw new TypeError('Node argument is not a child of the document handled by this ElementQuery');
    }

    // TODO read
    // TODO check that the rootNode of tree is this.watchedDoc
  }

  /**
   * Same as readDom but watches the tree so nodes that do not match a selector anymore are removed,
   * and nodes that do match are re-added.
   */
  watchDom(tree = this.watchedDoc) {
    this.readDom(tree);
    // TODO watch
    // TODO check that the rootNode of tree is this.watchedDoc
  }
}

export default function elementQueries(document: DocumentLike) {
  ensureDocumentLike(document);

  const instances = ElementQueries.instance;

  if (!instances.has(document)) {
    instances.set(document, new ElementQueries(document));
  }

  return instances.get(document);
}

function ensureDocumentLike(doc) {
  if (!isDocumentLike(doc)) {
    throw new TypeError('Parameter must be a document or document-like');
  }
}

function isDocumentLike(doc: DocumentLike) {
  if (doc == null) {
    return false;
  }

  if (!doc.nodeName) {
    return false;
  }

  return (doc.nodeName === '#document' || doc.nodeName === '#document-fragment');
}

function getRootNode(elem) {
  if (elem.parentNode) {
    return getRootNode(elem.parentNode);
  }

  return elem;
}

function (ResizeSensor) {

  /**
   *
   * @type {Function}
   * @constructor
   */
  var ElementQueries = function () {

    var trackingActive = false;
    var elements = [];

    /**
     *
     * @param {HTMLElement} element
     * @constructor
     */
    function SetupInformation(element) {
      this.element = element;
      this.options = {};
      var key, option, width = 0, height = 0, value, actualValue, attrValues, attrValue, attrName;

      /**
       * @param {Object} option {mode: 'min|max', property: 'width|height', value: '123px'}
       */
      this.addOption = function (option) {
        var idx = [option.mode, option.property, option.value].join(',');
        this.options[idx] = option;
      };

      /**
       * Extracts the computed width/height and sets to min/max- attribute.
       */
      this.call = function () {
        // extract current dimensions
        width = this.element.offsetWidth;
        height = this.element.offsetHeight;

        attrValues = {};

        for (key in this.options) {
          if (!this.options.hasOwnProperty(key)) {
            continue;
          }
          option = this.options[key];

          value = convertToPx(this.element, option.value);

          actualValue = option.property == 'width' ? width : height;
          attrName = option.mode + '-' + option.property;
          attrValue = '';

          if (option.mode == 'min' && actualValue >= value) {
            attrValue += option.value;
          }

          if (option.mode == 'max' && actualValue <= value) {
            attrValue += option.value;
          }

          if (!attrValues[attrName]) attrValues[attrName] = '';
          if (attrValue && -1 === (' ' + attrValues[attrName] + ' ').indexOf(' ' + attrValue + ' ')) {
            attrValues[attrName] += ' ' + attrValue;
          }
        }

        for (var k in attributes) {
          if (!attributes.hasOwnProperty(k)) continue;

          if (attrValues[attributes[k]]) {
            this.element.setAttribute(attributes[k], attrValues[attributes[k]].substr(1));
          } else {
            this.element.removeAttribute(attributes[k]);
          }
        }
      };
    }

    /**
     * @param {HTMLElement} element
     * @param {Object}      options
     */
    function setupElement(element, options) {
      if (element.elementQueriesSetupInformation) {
        element.elementQueriesSetupInformation.addOption(options);
      } else {
        element.elementQueriesSetupInformation = new SetupInformation(element);
        element.elementQueriesSetupInformation.addOption(options);
        element.elementQueriesSensor = new ResizeSensor(element, function () {
          element.elementQueriesSetupInformation.call();
        });
      }
      element.elementQueriesSetupInformation.call();

      if (trackingActive && elements.indexOf(element) < 0) {
        elements.push(element);
      }
    }

    /**
     * Start the magic. Go through all collected rules (readRules()) and attach the resize-listener.
     */
    function findElementQueriesElements() {
      var query = getQuery();

      for (var mode in allQueries) if (allQueries.hasOwnProperty(mode)) {

        for (var property in allQueries[mode]) if (allQueries[mode].hasOwnProperty(property)) {
          for (var value in allQueries[mode][property]) if (allQueries[mode][property].hasOwnProperty(value)) {
            var elements = query(allQueries[mode][property][value]);
            for (var i = 0, j = elements.length; i < j; i++) {
              setupElement(elements[i], {
                mode: mode,
                property: property,
                value: value
              });
            }
          }
        }

      }
    }

  };
};

function noop() {
}
