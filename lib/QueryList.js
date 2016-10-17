'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _domStyleSheets = require('./domStyleSheets');

var _marked = [matchAll].map(regeneratorRuntime.mark);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO code style => https://github.com/eslint/eslint/issues/3229
var SELECTOR_REGEX = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/mgi; // eslint-disable-line max-len
var SELECTOR_ATTRIBUTES_REGEX = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;

// TODO if a stylesheet is deleted, it should be removed from the cache.

var QueryList = function () {

  /** @private */
  function QueryList(onUnreadableSheet) {
    _classCallCheck(this, QueryList);

    this.styleSheetCache = new WeakSet();
    this.allQueries = new Map();

    this.onUnreadableSheet = onUnreadableSheet;
  }

  /** @private */


  /** @private */


  _createClass(QueryList, [{
    key: 'addStyleSheet',
    value: function addStyleSheet(styleSheet) {
      if (this.styleSheetCache.has(styleSheet)) {
        return;
      }

      this.readStyleSheet(styleSheet);
    }

    /** @private */

  }, {
    key: 'readStyleSheet',
    value: function readStyleSheet(styleSheet) {
      try {
        var rules = styleSheet.cssRules || styleSheet.rules;

        for (var i = 0, j = rules.length; i < j; i++) {
          var rule = rules[i];

          switch (rule.type) {
            case CSSRule.STYLE_RULE:
              this.readCssRule(rule);
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
  }, {
    key: 'markAsRead',
    value: function markAsRead(styleSheet) {
      this.styleSheetCache.add(styleSheet);
      if (styleSheet.ownerNode) {
        _domStyleSheets.domStyleSheets.add(styleSheet);
      }
    }
  }, {
    key: 'readCssRule',
    value: function readCssRule(rule) {
      var rawSelector = rule.selectorText.replace(/'/g, '"');
      var styleSheet = rule.parentStyleSheet;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = matchAll(SELECTOR_REGEX, rawSelector)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var match = _step.value;

          var featureSelector = match[1] + match[3];
          var rawElementFeature = match[2];

          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = matchAll(SELECTOR_ATTRIBUTES_REGEX, rawElementFeature)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var attrMatch = _step2.value;

              this.queueQuery(featureSelector, attrMatch[1], attrMatch[2], attrMatch[3], styleSheet);
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
    }

    /**
     * @param {!string} selector - A CSS selector the element query should watch.
     * @param {!string} featurePrefix - A prefix for the element feature.
     * @param {!string} elemFeature - The name of the element feature.
     * @param {!string} featureValue - element feature value.
     * @param {!CSSStyleSheet} styleSheet - The StyleSheet which added this rule.
     */

  }, {
    key: 'queueQuery',
    value: function queueQuery(selector, featurePrefix, elemFeature, featureValue, styleSheet) {

      if (!(styleSheet instanceof CSSStyleSheet)) {
        throw new TypeError('styleSheet is not a CSSStyleSheet');
      }

      var queryIdentifier = featurePrefix + '-' + elemFeature + '-' + featureValue;

      var query = void 0;
      if (this.allQueries.has(queryIdentifier)) {
        query = this.allQueries.get(queryIdentifier);
      } else {
        query = {
          selectors: [],
          feature: {
            name: elemFeature,
            prefix: featurePrefix,
            value: featureValue
          }
        };

        this.allQueries.set(queryIdentifier, query);
      }

      query.selectors.push({ styleSheet: styleSheet, selector: selector });
    }
  }, {
    key: Symbol.iterator,
    value: regeneratorRuntime.mark(function value() {
      var toRemove, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, query, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, item;

      return regeneratorRuntime.wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              toRemove = [];
              _iteratorNormalCompletion3 = true;
              _didIteratorError3 = false;
              _iteratorError3 = undefined;
              _context.prev = 4;
              _iterator3 = this.allQueries.values()[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
                _context.next = 17;
                break;
              }

              query = _step3.value;

              if (query.selectors.find(function (item) {
                return (0, _domStyleSheets.isDeadStyleSheet)(item.styleSheet);
              }) != null) {
                query.selectors = query.selectors.filter(function (item) {
                  return !(0, _domStyleSheets.isDeadStyleSheet)(item.styleSheet);
                });
              }

              if (!(query.selectors.length === 0)) {
                _context.next = 12;
                break;
              }

              // no more selectors, delete this!
              toRemove.push(query);
              return _context.abrupt('continue', 14);

            case 12:
              _context.next = 14;
              return query;

            case 14:
              _iteratorNormalCompletion3 = true;
              _context.next = 6;
              break;

            case 17:
              _context.next = 23;
              break;

            case 19:
              _context.prev = 19;
              _context.t0 = _context['catch'](4);
              _didIteratorError3 = true;
              _iteratorError3 = _context.t0;

            case 23:
              _context.prev = 23;
              _context.prev = 24;

              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }

            case 26:
              _context.prev = 26;

              if (!_didIteratorError3) {
                _context.next = 29;
                break;
              }

              throw _iteratorError3;

            case 29:
              return _context.finish(26);

            case 30:
              return _context.finish(23);

            case 31:
              _iteratorNormalCompletion4 = true;
              _didIteratorError4 = false;
              _iteratorError4 = undefined;
              _context.prev = 34;


              for (_iterator4 = toRemove[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                item = _step4.value;

                this.allQueries.delete(item);
              }
              _context.next = 42;
              break;

            case 38:
              _context.prev = 38;
              _context.t1 = _context['catch'](34);
              _didIteratorError4 = true;
              _iteratorError4 = _context.t1;

            case 42:
              _context.prev = 42;
              _context.prev = 43;

              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }

            case 45:
              _context.prev = 45;

              if (!_didIteratorError4) {
                _context.next = 48;
                break;
              }

              throw _iteratorError4;

            case 48:
              return _context.finish(45);

            case 49:
              return _context.finish(42);

            case 50:
            case 'end':
              return _context.stop();
          }
        }
      }, value, this, [[4, 19, 23, 31], [24,, 26, 30], [34, 38, 42, 50], [43,, 45, 49]]);
    })
  }]);

  return QueryList;
}();

exports.default = QueryList;


function matchAll(regex, str) {
  var attrMatch;
  return regeneratorRuntime.wrap(function matchAll$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          attrMatch = void 0;

        case 1:
          if (!(null !== (attrMatch = regex.exec(str)))) {
            _context2.next = 6;
            break;
          }

          _context2.next = 4;
          return attrMatch;

        case 4:
          _context2.next = 1;
          break;

        case 6:
        case 'end':
          return _context2.stop();
      }
    }
  }, _marked[0], this);
}