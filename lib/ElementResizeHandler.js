'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _elementResizeDetector = require('element-resize-detector');

var _elementResizeDetector2 = _interopRequireDefault(_elementResizeDetector);

var _ElementQueries = require('./ElementQueries');

var _CssUtil = require('./CssUtil');

var _domStyleSheets = require('./domStyleSheets');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO replace with native impl the day it comes into life.
// https://github.com/wnr/element-resize-detector
var resizeDetector = (0, _elementResizeDetector2.default)({
  strategy: 'scroll'
});

var ElementResizeHandler = function () {
  /** @private */
  function ElementResizeHandler(element) {
    var _this = this;

    _classCallCheck(this, ElementResizeHandler);

    this.features = {};
    this.onChange = null;
    this.changed = false;

    this.element = element;

    var timeout = void 0;
    resizeDetector.listenTo(this.element, function () {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(function () {
        _this.refresh();
        timeout = null;
      }, 40);
    });
  }

  /**
   * @param feature - The feature.
   * @param styleSheet - The style at the source fo this new element-feature.
   *                     Used to check if the styleSheet has been removed.
   */


  /** @private */


  _createClass(ElementResizeHandler, [{
    key: 'addQueryFeature',
    value: function addQueryFeature(feature, styleSheet) {
      if (!styleSheet) {
        throw new TypeError('Missing stylesheet');
      }

      var idx = feature.prefix + '-' + feature.name + '=' + feature.value;

      // console.log(styleSheet.cssRules[0].cssText);

      // if (styleSheet.__tagged) {
      //   console.log(styleSheet, styleSheet.ownerNode, Object.prototype.toString.call(styleSheet));
      // }

      var featureHolder = this.features[idx];
      if (!featureHolder) {
        featureHolder = {
          feature: feature,
          styleSheets: new Set()
        };

        this.features[idx] = featureHolder;
      }

      featureHolder.styleSheets.add(styleSheet);

      this.refresh();
    }
  }, {
    key: 'refresh',
    value: function refresh() {
      var element = this.element;

      // extract current dimensions
      var width = element.offsetWidth;
      var height = element.offsetHeight;

      var attributeValues = {};

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(this.features)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var featureKey = _step.value;

          var elementFeatureHolder = this.features[featureKey];

          if (!elementFeatureHolder) {
            continue;
          }

          if (isDead(elementFeatureHolder.styleSheets)) {
            this.features[featureKey] = void 0;
            continue;
          }

          this.parentNode = elementFeatureHolder.styleSheets.values().next().value.ownerNode;

          var elementFeature = elementFeatureHolder.feature;

          var targetSize = (0, _CssUtil.convertToPx)(this.element, elementFeature.value);
          var currentSize = elementFeature.name === 'width' ? width : height;

          var attributeName = elementFeature.prefix + '-' + elementFeature.name;

          var attributeValue = void 0;
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
              throw new Error('Invalid Element Query Prefix ' + elementFeature.prefix);
          }

          if (attributeValue) {
            if (!attributeValues[attributeName]) {
              attributeValues[attributeName] = [attributeValue];
            } else if (attributeValues[attributeName].indexOf(attributeValue) === -1) {
              attributeValues[attributeName].push(attributeValue);
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

      var changed = this.changed;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = _ElementQueries.ATTRIBUTE_NAMES[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var attribute = _step2.value;

          if (attributeValues[attribute]) {
            var newValue = attributeValues[attribute].join(',');

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
  }, {
    key: 'detach',
    value: function detach() {
      if (!this.element[_ElementQueries.resizeListener]) {
        return;
      }

      resizeDetector.uninstall(this.element);
      delete this.element[_ElementQueries.resizeListener];
    }
  }]);

  return ElementResizeHandler;
}();

exports.default = ElementResizeHandler;


function isDead(sheets) {
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = sheets[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var sheet = _step3.value;

      if ((0, _domStyleSheets.isDeadStyleSheet)(sheet)) {
        sheets.delete(sheet);
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

  return sheets.size === 0;
}