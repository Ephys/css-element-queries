import 'regenerator-runtime';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import elementQueries, { ElementQueries, resizeListener } from '../src/ElementQueries';

chai.use(dirtyChai);

const RED = 'rgb(255, 0, 0)';
const BLUE = 'rgb(0, 0, 255)';

let currentTest = 0;

describe('elementQueries', () => {
  beforeEach(() => {
    currentTest++;
    const styles = document.head.querySelectorAll('[data-test-sheet]');
    Array.prototype.forEach.call(styles, style => style.parentNode.removeChild(style));

    document.body.innerHTML = '';
  });

  it('returns an instance of ElementQueries', () => {
    expect(elementQueries()).to.be.instanceOf(ElementQueries);
  });

  it('throws if argument is not a document or document fragment', () => {
    expect(() => {
      elementQueries(document.createElement('div'));
    }).to.throw(TypeError);
  });

  it('defaults the argument to `window.document`', () => {
    expect(elementQueries()).to.equal(elementQueries(document));
  });

  it('Sets the style of elements matching the selector without [mediaFeature]', async() => {
    addStyle(`
  .test1Parent h1 {
    color: red;
  }

  .test1Parent[min-width~="40px"][max-width~="50px"] h1 {
    color: blue;
  }
`);

    const child = createElement('h1');
    const parent = createElement({ className: 'test1Parent', children: child });
    document.body.appendChild(parent);

    elementQueries();

    await setStyleAndExpect(parent, { width: '35px' }, () => {
      expect(getTextColor(child)).to.equal(RED, '35px => red');
    });

    await setStyleAndExpect(parent, { width: '45px' }, () => {
      expect(getTextColor(child)).to.equal(BLUE, '45px => blue');
    });

    await setStyleAndExpect(parent, { width: '55px' }, () => {
      expect(getTextColor(child)).to.equal(RED, '55px => red');
    });
  });

  it('Stops updating the style once the styleSheet has been removed', () => {
    const sheet = createStyle(`
  .test1Parent h1 {
    color: red;
  }

  .test1Parent[min-width~="40px"][max-width~="50px"] h1 {
    color: blue;
  }
`);

    document.head.appendChild(sheet);

    const child = createElement('h1');
    const parent = createElement({ className: 'test1Parent', children: child });
    document.body.appendChild(parent);

    elementQueries();

    document.head.removeChild(sheet);

    return Promise.race([
      wait(500),
      setStyleAndExpect(parent, { width: '45px' }, () => {
        throw new Error('Callback should not have been called');
      }),
    ]);
  });

  describe('features', () => {
    it('min-width~="x" means width >= x', async() => {

      addStyle(`
  .test_div {
    color: red;
  }

  .test_div[min-width~="50px"] {
    color: blue;
  }
`);

      const elem = createElement({ className: 'test_div' });
      document.body.appendChild(elem);

      elementQueries(document);
      await setStyleAndExpect(elem, { width: '50px' }, () => {
        expect(getTextColor(elem)).to.equal(BLUE, '50px - should be blue');
      });

      await setStyleAndExpect(elem, { width: '49px' }, () => {
        expect(getTextColor(elem)).to.equal(RED, '49px - should be red');
      });
    });

    it('max-width~="x" means width <= x', async() => {

      addStyle(`
  .test_div {
    color: red;
  }

  .test_div[max-width~="50px"] {
    color: blue;
  }
`);

      const elem = createElement({ className: 'test_div' });
      document.body.appendChild(elem);

      elementQueries(document);
      await setStyleAndExpect(elem, { width: '50px' }, () => {
        expect(getTextColor(elem)).to.equal(BLUE, '50px - should be blue');
      });

      await setStyleAndExpect(elem, { width: '51px' }, () => {
        expect(getTextColor(elem)).to.equal(RED, '51px - should be red');
      });
    });

    it('min-height~="x" means height >= x', async() => {

      addStyle(`
  .test_div {
    color: red;
  }

  .test_div[min-height~="50px"] {
    color: blue;
  }
`);

      const elem = createElement({ className: 'test_div' });
      document.body.appendChild(elem);

      elementQueries(document);
      await setStyleAndExpect(elem, { height: '50px' }, () => {
        expect(getTextColor(elem)).to.equal(BLUE, '50px - should be blue');
      });

      await setStyleAndExpect(elem, { height: '49px' }, () => {
        expect(getTextColor(elem)).to.equal(RED, '49px - should be red');
      });
    });

    it('max-height~="x" means height <= x', async() => {

      addStyle(`
  .test_div {
    color: red;
  }

  .test_div[max-height~="50px"] {
    color: blue;
  }
`);

      const elem = createElement({ className: 'test_div' });
      document.body.appendChild(elem);

      elementQueries(document);
      await setStyleAndExpect(elem, { height: '50px' }, () => {
        expect(getTextColor(elem)).to.equal(BLUE, '50px - should be blue');
      });

      await setStyleAndExpect(elem, { height: '51px' }, () => {
        expect(getTextColor(elem)).to.equal(RED, '51px - should be red');
      });
    });
  });
});

function setStyleAndExpect(element, style, onChange) {

  return new Promise((resolve, reject) => {
    element[resizeListener].onChange = renameFunction(`onChangeWrapperTest${currentTest}`, elem => {
      element[resizeListener].onChange = renameFunction(`onChangeErrorTest${currentTest}`, () => {
        throw new Error('callback called twice!');
      });

      try {
        onChange(elem);
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    Object.assign(element.style, style);
  });
}

function getTextColor(elem) {
  return window.getComputedStyle(elem).color;
}

function createElement(type = {}, props = type): HTMLElement {
  if (!props || typeof props !== 'object') {
    props = {};
  }

  const { children, ...properties } = props;

  if (typeof type === 'object') {
    type = 'div';
  }

  const elem = document.createElement(type);
  Object.assign(elem, properties);

  if (children) {
    if (!Array.isArray(children)) {
      elem.appendChild(children);
    } else {
      for (const child of children) {
        elem.appendChild(child);
      }
    }
  }

  return elem;
}

function createStyle(textContent): HTMLStyleElement {
  const styleNode = document.createElement('style');
  styleNode.textContent = textContent;
  styleNode.dataset.testSheet = '';

  return styleNode;
}

function addStyle(textContent, doc = document): HTMLStyleElement {
  const style = createStyle(textContent);

  (doc.head || doc).appendChild(style);

  return style;
}

function wait(time): Promise {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

function renameFunction(name, fn) {
  /* eslint-disable */
  const makeFunction = new Function(`
    return function closure(func) {
      return function ${name}() { 
        return func.apply(arguments); 
      };
    };
  `);

  const closure = makeFunction();
  return closure(fn);
  /* eslint-enable */
}
