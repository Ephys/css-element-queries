'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ElementQueries = exports.resizeListener = exports.ATTRIBUTE_NAMES = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author Marc J. Schmidt, Guylian Cox
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license MIT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @description Based on https://github.com/marcj/css-element-queries
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @preserve
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * directory of this distribution and at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

exports.default = elementQueries;

var _QueryList = require('./QueryList');

var _QueryList2 = _interopRequireDefault(_QueryList);

var _ElementResizeHandler = require('./ElementResizeHandler');

var _ElementResizeHandler2 = _interopRequireDefault(_ElementResizeHandler);

var _DomUtil = require('./DomUtil');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ATTRIBUTE_NAMES = exports.ATTRIBUTE_NAMES = ['min-width', 'min-height', 'max-width', 'max-height'];
Object.freeze(ATTRIBUTE_NAMES);

// This is exported for testing purposes only!
var resizeListener = exports.resizeListener = Symbol('elemQueriesResizeListener');

/*
 * TODO
 * - Take disabled sheets into account
 * - add a possibility to watch added/removed nodes with MutationObserver
 * - MUST detect detached roots and removed element query from them.
 */

var ElementQueries = exports.ElementQueries = function () {

  /** @private */
  function ElementQueries() {
    var _this = this;

    var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.document;

    _classCallCheck(this, ElementQueries);

    this.unreadableListeners = new Set();

    this.watchedDoc = doc;

    this.queryList = new _QueryList2.default(function (error, sheet) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _this.unreadableListeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var listener = _step.value;

          listener(error, sheet);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    });
  }

  /** @private */


  /** @readonly */


  _createClass(ElementQueries, [{
    key: 'addUnreadableSheetListener',
    value: function addUnreadableSheetListener(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('Listener should have been a function');
      }

      this.unreadableListeners.add(listener);
      return listener;
    }
  }, {
    key: 'removeUnreadableSheetListener',
    value: function removeUnreadableSheetListener(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('Listener should have been a function');
      }

      return this.unreadableListeners.delete(listener);
    }

    /**
     * Read new styleSheets then search the dom for element query elements.
     */

  }, {
    key: 'update',
    value: function update() {
      this.readStyleSheets();
      this.readDom();
    }

    /**
     * Reads style sheets that haven't been read so far to extract element query queries.
     */

  }, {
    key: 'readStyleSheets',
    value: function readStyleSheets() {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.watchedDoc.styleSheets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var styleSheet = _step2.value;

          this.queryList.addStyleSheet(styleSheet);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }

    /**
     * Read a specific style sheet.
     */

  }, {
    key: 'readStyleSheet',
    value: function readStyleSheet(styleSheet) {
      this.queryList.addStyleSheet(styleSheet);
    }

    /**
     * Search a dom tree for an element whose selector matches an element query one.
     */

  }, {
    key: 'readDom',
    value: function readDom() {
      var tree = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.watchedDoc;

      var root = (0, _DomUtil.getRootNode)(tree);
      if (root !== this.watchedDoc) {
        throw new TypeError('Node argument is not a child of the document handled by this ElementQuery');
      }

      // TODO selector => selectors, join and give it as-is to handler
      // so it can delete dead styleSheets.
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.queryList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _step3$value = _step3.value;
          var selectors = _step3$value.selectors;
          var feature = _step3$value.feature;
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = selectors[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var _step4$value = _step4.value;
              var selector = _step4$value.selector;
              var styleSheet = _step4$value.styleSheet;

              var nodes = tree.querySelectorAll(selector);

              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                for (var _iterator5 = nodes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                  var node = _step5.value;

                  setupNode(node, feature, styleSheet);
                }
              } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion5 && _iterator5.return) {
                    _iterator5.return();
                  }
                } finally {
                  if (_didIteratorError5) {
                    throw _iteratorError5;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }]);

  return ElementQueries;
}();

ElementQueries.instances = new WeakMap();
function elementQueries() {
  var document = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.document;

  (0, _DomUtil.ensureDocumentLike)(document);

  var instances = ElementQueries.instances;

  if (!instances.has(document)) {
    instances.set(document, new ElementQueries(document));
  }

  var instance = instances.get(document);
  instance.update();

  return instance;
}

function setupNode(element, elemQuery, styleSheet) {
  if (!element[resizeListener]) {
    element[resizeListener] = new _ElementResizeHandler2.default(element);
  }

  element[resizeListener].addQueryFeature(elemQuery, styleSheet);
}