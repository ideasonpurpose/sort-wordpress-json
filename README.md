# Sort WordPress JSON

> ### _This is a work in progress._
>
> ### _Needs a real name._

#### Version 0.0.1

> "Things should be where things should be."

Enforcing property order by convention makes development and debugging faster because we know where properties should be. This project was largely inspired by [sort-package-json](https://github.com/keithamus/sort-package-json), but takes a different approach and deep-sorts WordPress JSON files according to their schema.

## Why?

As the WordPress theme.json files assume a larger and large role in WordPress development, navigating the files becomes slower. Part of the reason is that the files tend to grow organically during development, declarations get added as needed, usually at the end, and the files become an organic pile of ad hoc additions.

Without a strongly enforced order, diffing theme.json files across projects is very difficult. When a slightly obscure new property is added to one project, not being able to immediately diff the updated theme.json file against an older project leads to wasted effort and mis-used dev time.

This packages takes the [published WordPress schemas](https://github.com/WordPress/gutenberg/tree/trunk/schemas) as the source of truth, and uses their published property order as a baseline for re-ordering a file's properties.

Files should include a $schema property. This tool will attempt to use the linked schema, and will fall back to a local copy which are synced from the WordPress source repo whenever this package is updated. These three schema are bundled:

- https://schemas.wp.org/trunk/theme.json
- https://schemas.wp.org/trunk/block.json
- https://schemas.wp.org/trunk/font-collection.json

### No really, this is better

Much as [package.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#description), [composer.json](https://getcomposer.org/doc/04-schema.md) and a of CSS linting projects [stylelint-order](https://github.com/hudochenkov/stylelint-order) assert a more useful, logical order for properties, this project also takes an opinionated stance on property order.

### Overrides

At some point, the WordPress schema properties were alphabetized. For those of us still hand-authoring a significant amount of our theme.json files, this is kind of insane. CSS

Some order overrides include:

Grouping color palette, gradient and duotone options together. Instead of `custom`, `customDuotone`, `customGradient`, `defaultPalette`, `defaultDuotone`, etc., `sort-theme-json` will output something like the following:

```json
{
  "color": {
    "custom": true,
    "defaultPalette": false,
    "palette": [],

    "customGradient": false,
    "defaultGradients": false,
    "gradients": [],

    "customDuotone": true,
    "defaultDuotone": false,
    "duotone": []
  }
}
```

### Don't sort that

Because some enumerable collections like sizes are also directly exposed to content authors, those will remain unsorted. Lists of options like color palettes, font listings and sizes may be arranged in a specific order and will pass through unchanged.

---

## Notes

The theme.json schema is updated fairly regularly. This project should have some automated way of ingesting and updating the schema.

https://github.com/WordPress/gutenberg/commits/trunk/schemas/json/theme.json

Use the [jsonc-parser](https://www.npmjs.com/package/jsonc-parser) library to walk the document after formatting with Prettier, then replace specific elements with collapsed representations:

https://x.com/i/grok/share/3ciwiguDWbf7NuHJnXGaybqe4

Let's only sort JSON files with an explicit `$schema` key pointing to a valid schema file.

## TODO:

- [ ] Override sort order, settings.layout should appear first

- [ ] Fallback schema should be included with the package, download the latest on build. This should work offline.

- [ ] Non-schema items pass through unsorted? Or option to sort alphabetically?

- [ ] Override sorts only specified properties on non-schema entries?

- [ ] If you're insane, you can set indent to 0, which will remove all formatting and output a condensed, stringified JSON file.

- [ ] ~~Due to slow retrieval and infrequent source changes, maybe the source schema are just baked into each release as part of the build? If we _really_ needed to, there could be a flag for always loading remote schemas from the file instead of the cache.~~ **_-- Shelving this for now, it's an optimization._**

- [ ] Add tests for composer.json

- [ ] Break out the schema-sort into a separate package/library.

- [ ] Property collection overrides are isolated in separate files with the intention that future updates will allow for individual customization.

- [ ] Anything with a CSS parallel should follow CSS conventions. Eg. Any object describing a box will be re-ordered to match css: Top, Right, Bottom, Left. [Border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius) should be re-ordered to:
      top-left, top-right, bottom-right, bottom-left.

- [ ] Indentation should be inherited from the source file and used as the basis for reformatting with Prettier. Indentation can also be overridden with a command-line flag.

- [ ] Cache remote schema files?

- [ ] Bundled schema files should be listed in a JSON file which is used for local fallbacks and for refreshing locally bundled schemas. Key the file by the URL.

- [ ] Should be able to run on a directory, and sort all JSON files which contain a $schema. Or, look for WordPress-specific JSON files only?

## Notes and References

WordPress json schema overview and explanations:

https://developer.wordpress.org/news/2024/07/json-schema-in-wordpress/

WordPress schema source sub-repo (in Gutenberg)
https://github.com/WordPress/gutenberg/tree/trunk/schemas

This uses the [**json-schema-ref-parser**](https://www.npmjs.com/package/@apidevtools/json-schema-ref-parser) for de-reffing JSON schema's so we can loop over their properties more easily.

### Note on top-level run

If run from the top level of a theme, this should find and format all of the following:

- theme.json
- styles/\*.json
- \*_/_.block.json

Do not search in node_modules/ or vendor/

### Notes on overrides

This should accept either an array of optionally dot.delimited properties, or an object (JSON file?) containing a hierarchical example of objects to override.

#### Examples:

~~Override object:~~ This doesn't work very well since it would require a representation the entire tree prior to the overridden key. Without that, every property in the chain would be applied first, putting `settings` before all of it's other top-level sibling properties. The list of dot-separated properties can be matched against the stored path items,. 

```json
{
  "settings": {
    "layout": 0,
    "color": {
      "custom": 0,
      "gradient": 0,
      "customGradient": 0
    }
  }
}
```

Dot-array of keys:

This works better because we only need to consider the values which match the current level. THe following example would override settings.layout, but would ignore all other sibling properties of settings.layout. Likewise, the three settings.color properties would be overridden, but settings.color would be otherwise unaffected relative to it's siblings.  

```json
[
  "settings.layout",
  "settings.color.custom"
  "settings.color.gradient"
  "settings.color.customGradient"
]
```


### CLI Interface

Sketching here: 


sort-wp-json <file> --no-overrides
Flags: 

* `--no-overrides` - Output direct from the schema with no opinionated overrides
* `--schema` - override a schema (accepts a file path or url)
* `--verbose`


Note: would --no-overrides be the same as --overrides=[] (empty array of overrides)?  Probably best to keep it explicit. IF no-overrides was combined with overrides, then the defaults would first be removed, then the provided overrides would be used. If only a list of overrides was provided, then the list would have the internal overrides applied onto it, so the provided keys would take priority. 

> TODO: Overrides should be able to be stored in package.json, similar to how Prettier does:
>
> In package.json, add a sort-wp-json property, something like this:

```json
{
  "name": "sort-wp-json-example",
  "description": "Example showing sort-wp-json overrides in package.json",
  "sort-wp-json": {
    "overrides": [
      "settings.layout",
      "settings.useRootPaddingAwareAlignments",
      "settings.color.custom",
      "settings.color.defaultPalette",
      "settings.color.palette",
      "settings.color.customGradient",
      "settings.color.defaultGradients",
      "settings.color.gradients",
    ]
  }
}
```



## Running in Development

Until this is proven and released, it must be run directly from this repository. In the terminal, type this, then drag in the files or directory containing files to be sorted:

```
$ node cli.js <file>
```