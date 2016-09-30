# Contributing

## Terminology

The terminology for *Element Queries* is based on [the *Media Query* one](https://www.w3.org/TR/css3-mediaqueries/).

A media query is composed of *media features* which themselves have *prefixes* and *values*.

```
        v media feature prefix 
@media (min-width: 400px) {
            ^ media feature     
                   ^ media feature value
    .widget-name h2 {}
    ^ selector
}
```

An Element Query is composed of *element features* which, too, have prefixes and values.

```
v selector                       v selector
.widget-name[min-width~="400px"] h2 {}
             ^ element feature prefix
                 ^ element feature
                         ^ element feature value
```
