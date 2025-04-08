# Sort WordPress JSON

This project is inspired by the wonderful sort-package-json package. This does a lot less, it only sorts the valid json files supported by Gutenberg, currently theme.json, block.json and font-collection.json. Maybe it'll do more someday.

Lint your files. Because things should be where they should be.

## Why?

As the WordPress theme.json files devour more and more of the development process in WordPress, navigating the files becomes slower. Part of the reason is that the files tend to grow organically during development, and declarations get added as needed, usually at the end.

Without a strongly enforced order, diffing theme.json files across projects is very difficult to useless. If a slightly obscure new property is added to one project, not being able to immediately diff the updated theme.json file against an older project leads to wasted effort and mis-used dev time.


~This package hopes to help by providing an empirical sort order based on the published WordPress schemas:~
- https://schemas.wp.org/trunk/theme.json
- https://schemas.wp.org/trunk/block.json
- https://schemas.wp.org/trunk/font-collection.json
NOTE: Don't do that. Order the file based on whichever scheme is noted at the top, or fallback to the trunk/theme.json. All fragment files should be covered by the main one.

Idea: We _could_ provide a flag for ordering based on a specific versioned schema, but that seems like a waste of time and effort. WordPress changes too frequenly, and updates routinely break existing code requiring upgrades. Just stick with the most recent. This is a dev tool, there should be a baseline expectation that the people using it are capable of fixing things and don't need to be protected from themselves. 

Schemas are automatically updated with each versioned release.

### No really, this is better

Initial sort order was derived directly from the canonical theme.json schema. That file (included in the source package distribution) was parsed, and various settings property definitions were used for initial order.

Much as [package.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#description), [composer.json](https://getcomposer.org/doc/04-schema.md) and a of CSS linting projects [stylelint-order](https://github.com/hudochenkov/stylelint-order) assert a more useful, logical order for properties, this project also takes an opinionated stance on property order.

Initial sort order was derived directly from the canonical [theme.json schema](https://schemas.wp.org/trunk/theme.json). That file (included in the source package distribution) was parsed, and various settings property definitions were used for initial order. However many (but not all) of the schema definitions listed properties alphabetically. That makes sense for a maintainable schema, but not so much for working theme.json files in production.

Property collection overrides are isolated in separate files with the intention that future updates will allow for individual customization.

### Overrides

At some point, the WordPress schema properties were alphabetized. For those of us still hand-authoring a significant amount of our theme.json files, this is kind of insane. CSS 


Some order overrides include:

Grouping color palette, gradient and duotone options together. Instead of `custom`, `customDuotone`, `customGradient`, `defaultPalette`, `defaultDuotone`, etc., `sort-theme-json` will output something like the following:

```json
{
    "color": {
        "custom": true,
        "defaultPalette": false,
        "palette": [

        ],
        "customGradient": false,
        "defaultGradients": false,
        "gradients": [

        ],
        "customDuotone": true,
        "defaultDuotone": false,
        "duotone": [

        ]
}

We put Duotones last because we think adding that feature was a mistake.

Generally, anything with a CSS parallel will follow CSS conventions. Eg. Any object describing a box will be re-ordered to match css: Top, Right, Bottom, Left. 



### Don't sort that

Because some enumerable collections like sizes are also directly exposed to authors, those will remain unsorted. Lists of options like color palettes, font listings and sizes may be arranged in a specific order and will pass through unchanged.


## Notes

The theme.json schema is updated fairly regularly. This project should have some automated way of ingesting and updating the schema.

https://github.com/WordPress/gutenberg/commits/trunk/schemas/json/theme.json



### jsonschema library

I don't think this is actually necessary. Validating the file is outside the scope of this project, all I want to do with the schema is ingest it and use the order of properties as a baseline for ordering the files.

Better solution: [**json-schema-ref-parser**](https://www.npmjs.com/package/@apidevtools/json-schema-ref-parser)  If that
```


## How it works (attempt 2025-01)

The schema will be used as the basis for ordering. Overrides will be applied to the definitions section, then the schema will be dereffed and iterated. For each nested object, known properties will be copied first based on the theme.json schema, then any remaining properties will be sorted alphabetically and merged.



### Indentation

Indentation will be inherited from the source file and used as the basis for reformatting with Prettier. Indentation can also be overridden with the 



## Custom formatting idea from Grok

Use the [jsonc-parser](https://www.npmjs.com/package/jsonc-parser) library to walk the document after formatting with Prettier, then replace specific elements with collapsed representations: 

https://x.com/i/grok/share/3ciwiguDWbf7NuHJnXGaybqe4



## TODO: 

Fallback schema should be included with the package, download the latest on build. This should work offline. 

If you're insane, you can set indent to 0, which will remove all formatting and output a condensed, stringified JSON file. 

Due to slow retrieval and infrequent source changes, maybe the source schema are just baked into each release as part of the build? If we _really_ needed to, there could be a flag for always loading remote schemas from the file instead of the cache.

Shelving that for now, it's an optimization.


## Notes and References

WordPress json schema overview and explanations: 

https://developer.wordpress.org/news/2024/07/json-schema-in-wordpress/

WordPress schema source sub-repo (in Gutenberg)
https://github.com/WordPress/gutenberg/tree/trunk/schemas





## Plane questions

- Q. How to run vitest with full breakpoint debugging in vscode? 
    > Open JavaScript Debug terminal from the VS Code terminal dropdown menu. Run the tests normally. 
- how to increase the collapse limit for nested objects in the js console when dumping from vitest?
    > This works, but it's gross:

    ``` js
    import util from 'node:util';
    console.log('Custom:', util.inspect(deepObject, { depth: 10 }));
    ```

