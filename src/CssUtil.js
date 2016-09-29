/**
 *
 * @param element
 * @returns {Number}
 */
export function getEmSize(element) {
  if (!element) {
    element = document.documentElement;
  }

  const fontSize = window.getComputedStyle(element, null).fontSize;
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
export function convertToPx(element, value) {
  const numbers = value.split(/\d/);
  const units = numbers[numbers.length - 1];
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
    case 'vmax': {
      const vw = document.documentElement.clientWidth / 100;
      const vh = document.documentElement.clientHeight / 100;
      const chooser = Math[units === 'vmin' ? 'min' : 'max'];
      return value * chooser(vw, vh);
    }

    default:
      return value;
    // for now, not supporting physical units (since they are just a set number of px)
    // or ex/ch (getting accurate measurements is hard)
  }
}
