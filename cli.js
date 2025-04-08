#!/usr/bin/env node
import { globbySync } from 'globby'
import fs from 'node:fs'
import sortThemeJson from './index.js'


// TODO: Offer an indent option which accepts a number. If this appears,
//       JSON will be indented with spaces. Out of deference to WordPress
//       conventions, the default formatting for output files uses tabs.