'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEmSize = getEmSize;
exports.convertToPx = convertToPx;
/**
 *
 * @param element
 * @returns {Number}
 */
function getEmSize(element) {
  if (!element) {
    element = document.documentElement;
  }

  var fontSize = window.getComputedStyle(element, null).fontSize;
  return parseFloat(fontSize) || 16;
}

/**
 *
 * @copyright https://github.com/Mr0grog/element-query/blob/master/LICENSE
 *
 * @param {HTMLElement} element
 * @param {*} value
 * @returns {*}
 */
function convertToPx(element, value) {
  var numbers = value.split(/\d/);
  var units = numbers[numbers.length - 1];
  value = parseFloat(value);

  switch (units) {
    case 'px':
      return value;

    case 'em':
      return value * getEmSize(element);

    case 'rem':
      return value * getEmSize();

    // Viewport units!
    // According to http://quirksmode.org/mobile/tableViewport.html
    // documentElement.clientWidth/Height gets us the most reliable info
    case 'vw':
      return value * document.documentElement.clientWidth / 100;

    case 'vh':
      return value * document.documentElement.clientHeight / 100;

    case 'vmin':
    case 'vmax':
      {
        var vw = document.documentElement.clientWidth / 100;
        var vh = document.documentElement.clientHeight / 100;
        var chooser = Math[units === 'vmin' ? 'min' : 'max'];
        return value * chooser(vw, vh);
      }

    default:
      return value;
    // for now, not supporting physical units (since they are just a set number of px)
    // or ex/ch (getting accurate measurements is hard)
  }
}