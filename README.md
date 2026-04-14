# Sort WordPress JSON

#### Version 0.0.4

> "Things should be where things should be."

Enforcing property order makes development and debugging faster because we know where properties should be. This project was largely inspired by [sort-package-json](https://github.com/keithamus/sort-package-json), but takes a different approach: Both deep-sorting WordPress JSON files according to their schemas and formatting for consistency and easier reading.

### Why?

As JSON has become central to WordPress development, our files often become a mess of organic, as-needed additions. Without an enforced order, editing **theme.json** files gets slower and comparing them across projects becomes nearly impossible, wasting time and frustrating developers.

## Installation

This is a pre-release work in progress. Use at your own risk. Install direct from GitHub:

```sh
npm install github:ideasonpurpose/sort-wordpress-json
```

## Sorting theme files

This tool modifies files. Use version control.

Run `sort-wp-json` from the root of your WordPress theme. If the directory does not contain a **theme.json** file, the tool will exit immediately.

If a **theme.json** file is found, the tool will search for additional WordPress JSON files below the current directory. It should find and format all of the following:

- `./theme.json`
- `./styles/**/\*.json`
- `./**/block.json`

The tool will not search in **node_modules/**, **vendor/** or **acf-json/**

All found files named **theme.json** and **block.json** will be sorted and formatted. Additional JSON files containing a valid schema will be sorted and formatted. If a **theme.json** or **block.json** files are found without a schema, the appropriate schema will be added, then the files will be sorted and formatted.

### Safety Checks

Before writing a file, the tool checks the resulting JSON for deep-equality with the original source JSON. This ensures the only changes were cosmetic and the data is the identical.

## Overrides and Expansions

Much as [package.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#description), [composer.json](https://getcomposer.org/doc/04-schema.md) and CSS linting projects like [stylelint-order](https://github.com/hudochenkov/stylelint-order) assert a more useful, logical order for properties, this project also has strong opinions on property order.

### Important stuff first

### Don't sort this stuff

Because some enumerable collections like `color.palette`, `fontSizes` and `SpacingSizes` are directly exposed to content authors, the children of those properties will not be re-ordered, but the component properties of their children will be normalized.

### Overrides

Keys can be forced to the top or bottom of their sibling groups using overrides. This allows customization of JSON properties beyond the default schema-based order, to make critical properties easier to find.

Specify overrides as an array of dot-delimited key-paths representing the nested path to a property. Overridden paths will appear at the top of their sibling groups. Paths can also be prefixed with an exclamation point (`!`) to force them to the bottom. Invalid or non-existent paths are ignored.

Example:

```json
[
  "settings.layout", // Force "layout" to top of "settings"
  "!settings.advanced", // Force "advanced" to bottom of "settings"
  "settings.color.custom", // Force "custom" to top of "color"
  "!settings.color.presets" // Force "presets" to bottom of "color"
]
```

##### Before (schema ordered)

```json
{
  "settings": {
    "color": {
      "presets": [],
      "custom": true
    },
    "advanced": {},
    "layout": {}
  }
}
```

##### After (with overrides applied)

```json
{
  "settings": {
    "layout": {}, // Moved to top
    "color": {
      "custom": true, // Moved to top
      "presets": [] // Moved to bottom
    },
    "advanced": {} // Moved to bottom
  }
}
```

### Expansions

Using the same path notation as Overrides, nodes can be marked to expand or collapse. Collapsing nodes follows these rules:

- Path points to object => Collapse object
- Path points to an array with more than 1 item => Collapse children on their own lines
- Path points to array with one item => Collapse array one line

#### Default Expansions

```json
[
  "settings.layout",
  "!settings.typography.fontSizes",
  "!settings.color.duotone",
  "!settings.color.palette"
]
```

### Schema handling

The [published WordPress schemas](https://github.com/WordPress/gutenberg/tree/trunk/schemas) are the source of truth, their published property order is used as the baseline for re-ordering a file's properties.

Files should include a $schema property. This tool will attempt to use the linked schema, and will fall back to a local copy which are synced from the WordPress source repo whenever this package is updated. These three schema are bundled:

- https://schemas.wp.org/trunk/theme.json
- https://schemas.wp.org/trunk/block.json
- https://schemas.wp.org/trunk/font-collection.json

Files matching known patterns for theme.json or block.json will

If the CLI is run without arguments in a WordPress theme, any files named theme.json or block.json will

### CLI Interface

Sketching here:

sort-wp-json <file> --no-overrides
Flags:

- `--no-overrides` - Output direct from the schema with no opinionated overrides
- `--schema` - override a schema (accepts a file path or url)
- `--verbose`

Note: would --no-overrides be the same as --overrides=[] (empty array of overrides)? Probably best to keep it explicit. IF no-overrides was combined with overrides, then the defaults would first be removed, then the provided overrides would be used. If only a list of overrides was provided, then the list would have the internal overrides applied onto it, so the provided keys would take priority.

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
      "settings.color.gradients"
    ]
  }
}
```

### Dry-run

To see what sort-wp-json would do, use the `--dry-run` flag (or `-n`). For colors, pipe through [**jq**](https://jqlang.org), though this will scrub some of the formatting.

## License

MIT

---

## Cruft, leftovers and notes not yet deleted

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

---

## Notes and References

WordPress json schema overview and explanations:

https://developer.wordpress.org/news/2024/07/json-schema-in-wordpress/

WordPress schema source sub-repo (in Gutenberg)
https://github.com/WordPress/gutenberg/tree/trunk/schemas

This uses the [**json-schema-ref-parser**](https://www.npmjs.com/package/@apidevtools/json-schema-ref-parser) for de-reffing JSON schema's so we can loop over their properties more easily.

## More Notes

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

- [x] Anything with a CSS parallel should follow CSS conventions. Eg. Any object describing a box will be re-ordered to match css: Top, Right, Bottom, Left.
- [ ] [Border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius) should be re-ordered to:
      top-left, top-right, bottom-right, bottom-left.

- [ ] Indentation should be inherited from the source file and used as the basis for reformatting with Prettier. Indentation can also be overridden with a command-line flag.

- [ ] Cache remote schema files?

- [ ] Bundled schema files should be listed in a JSON file which is used for local fallbacks and for refreshing locally bundled schemas. Key the file by the URL.

- [ ] Should be able to run on a directory, and sort all JSON files which contain a $schema. Or, look for WordPress-specific JSON files only?
