# CSS Element Queries

Element Queries is a library adding support for element based media-queries to all new browsers (incl. IE7+).
It allows not only to define media-queries based on window-size but also adds 'media-queries' functionality 
based on element size while not causing performance lags due to an event based implementation.

It's a proof-of-concept event-based CSS element dimension query with valid CSS selector syntax.

## Features

 - No performance issues since it listens only on size changes of elements that have element query rules defined through css.
 - Queries are written in CSS.
 - Valid CSS Syntax. No transpiling, no special syntax.
 - All CSS selectors available. Uses regular attribute selector. No need to write rules in HTML.
 - supports and tested in webkit, gecko and IE (7/8/9/10/11).
 - `min-width`, `min-height`, `max-width` and `max-height` are supported so far.
 - works with any layout modifications: HTML (innerHTML etc), inline styles, DOM mutation, CSS3 transitions, 
 fluid layout changes (also percent changes), pseudo classes (:hover etc.), window resizes and more.
 - Supports the light DOM as well as Shadow DOMs.
 
More demos and information: http://marcj.github.io/css-element-queries/

## Caveats

- Your CSS needs to be readable, any CSS file that cannot be read through JavaScript because of CORS will be ignored
by the library.
- Local stylesheets do not work (using `file://` protocol).
- Does not work on elements that can't contain other elements. Wrapping them with a `div` works fine though (See demo).
- Adds additional hidden elements into selected target element and forces target element to be relative or absolute.

## Examples

### Element Query

```css
.widget-name h2 {
    font-size: 12px;
}

.widget-name[min-width~="400px"] h2 {
    font-size: 18px;
}

.widget-name[min-width~="600px"] h2 {
    padding: 55px;
    text-align: center;
    font-size: 24px;
}

.widget-name[min-width~="700px"] h2 {
    font-size: 34px;
    color: red;
}
```

As you can see we use the `~=` [attribute selector](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors).
Since this css-element-queries library adds new element attributes on the DOM element
(`<div class="widget-name" min-width="400px 700px"></div>`) depending on your actual CSS,
you should always use this attribute selector (especially if you have several element query rules on the same element).

```html
<div class="widget-name">
   <h2>Element responsiveness FTW!</h2>
</div>
```

## Usage

You will need a module loader to use this library.

```javascript
// TODO rename
import elementQueries from 'css-element-queries';

// enable elementQueries on the Light DOM.
const docElementQueries = elementQueries(document);

// enable elementQueries on a Shadow DOM.
const shadowElementQuery = elementQueries(aShadowRoot);
```

Note: Instances of ElementQueries are shared between identical nodes.

```javascript
elementQueries(document) === elementQueries(document);

elementQueries(aShadowRoot) === elementQueries(aShadowRoot);
elementQueries(aShadowRoot) !== elementQueries(document);
elementQueries(aShadowRoot) !== elementQueries(anotherShadowRoot);
```

## Issues



## Contributing

See CONTRIBUTING.md

## License

MIT license. Copyright [Marc J. Schmidt](https://twitter.com/MarcJSchmidt).
