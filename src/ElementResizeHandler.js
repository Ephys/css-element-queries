import makeResizeDetector from 'element-resize-detector';
import { ATTRIBUTE_NAMES } from './ElementQueries';
import { convertToPx } from './CssUtil';

const resizeDetector = makeResizeDetector();

export default class ElementResizeHandler {
  element: Node;
  options: Object = {};

  constructor(element) {
    this.element = element;

    resizeDetector.listenTo(this.element, () => this.refresh());
  }

  addOptions(options) {
    const idx = `${options.mode},${options.property},${options.value}`;
    this.options[idx] = options;
  }

  refresh() {
    const element = this.element;

    // extract current dimensions
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    const attrValues = {};

    for (const optionKey of Object.keys(this.options)) {
      const option = this.options[optionKey];
      const value = convertToPx(this.element, option.value);

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

    for (const attribute of ATTRIBUTE_NAMES) {

    }

    for (var k in attributes) {
      if (!attributes.hasOwnProperty(k)) continue;

      if (attrValues[attributes[k]]) {
        this.element.setAttribute(attributes[k], attrValues[attributes[k]].substr(1));
      } else {
        this.element.removeAttribute(attributes[k]);
      }
    }
  }

  detach() {
    resizeDetector.uninstall(this.element);
  }
}
