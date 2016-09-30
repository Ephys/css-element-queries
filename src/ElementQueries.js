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

import type { DocumentLike, ErrorCallback, ElemFeature } from '../types';
import QueryList from './QueryList';
import ElementResizeHandler from './ElementResizeHandler';
import { ensureDocumentLike, getRootNode } from './DomUtil';

export const ATTRIBUTE_NAMES: string[] = ['min-width', 'min-height', 'max-width', 'max-height'];
Object.freeze(ATTRIBUTE_NAMES);

const resizeListener = Symbol('elemQueriesResizeListener');

/*
 * TODO
 * - Take disabled sheets into account
 * - add a possibility to watch added/removed nodes with MutationObserver
 * - MUST detect detached roots and removed element query from them.
 */

export class ElementQueries {

  static instances: WeakMap<DocumentLike, ElementQueries> = new WeakMap();

  /** @readonly */
  watchedDoc: DocumentLike;

  /** @private */
  queryList: QueryList;

  /** @private */
  unreadableListeners: Set<ErrorCallback> = new Set();

  constructor(doc: DocumentLike = window.document) {
    this.watchedDoc = doc;

    this.queryList = new QueryList((error, sheet) => {
      for (const listener of this.unreadableListeners) {
        listener(error, sheet);
      }
    });
  }

  addUnreadableSheetListener(listener: ErrorCallback): ErrorCallback {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener should have been a function');
    }

    this.unreadableListeners.add(listener);
    return listener;
  }

  removeUnreadableSheetListener(listener: ErrorCallback): boolean {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener should have been a function');
    }

    return this.unreadableListeners.delete(listener);
  }

  /**
   * Read new styleSheets then search the dom for element query elements.
   */
  update() {
    this.readStyleSheets();
    this.readDom();
  }

  /**
   * Reads style sheets that haven't been read so far to extract element query queries.
   */
  readStyleSheets() {
    for (const styleSheet: CSSStyleSheet of this.watchedDoc.styleSheets) {
      this.queryList.readStyleSheet(styleSheet);
    }
  }

  /**
   * Read a specific style sheet.
   */
  readStyleSheet(styleSheet) {
    this.queryList.readStyleSheet(styleSheet);
  }

  /**
   * Search a dom tree for an element whose selector matches an element query one.
   */
  readDom(tree = this.watchedDoc) {
    const root = getRootNode(tree);
    if (root !== this.watchedDoc) {
      throw new TypeError('Node argument is not a child of the document handled by this ElementQuery');
    }

    for (const { selector, elemQuery } of this.queryList) {
      const nodes = tree.querySelectorAll(selector);

      for (const node of nodes) {
        setupNode(node, elemQuery);
      }
    }
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

function setupNode(element, elemQuery: ElemFeature) {
  if (!element[resizeListener]) {
    element[resizeListener] = new ElementResizeHandler(element);
  }

  element[resizeListener].addQueryFeature(elemQuery);
}
