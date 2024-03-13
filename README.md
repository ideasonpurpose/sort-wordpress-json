# Sort WordPress JSON

This project is inspired by the wonderful sort-package-json package. This does a lot less, it only sorts the valid json files supported by Gutenberg, currently theme.json, block.json and font-collection.json. Maybe it'll do more someday. 

Lint your files. Because things should be where they should be. 

## Why? 

As the WordPress theme.json files devour more and more of the development process in WordPress, navigating the files becomes slower. Part of the reason is that the files tend to grow organically during development, and declarations get added as needed, usually at the end. 

This package hopes to help by providing an empirical sort order based on the published WordPress schemas:

* https://schemas.wp.org/trunk/theme.json
* https://schemas.wp.org/trunk/block.json
* https://schemas.wp.org/trunk/font-collection.json

Schemas are automatically updated with each versioned release.

### Don't sort that

Because some enumerables like sizes are also directly exposed to authors, those will remain unsorted. Lists of options like color palettes, font listings and sizes may be arranged in a specific order and will pass through unchanged.