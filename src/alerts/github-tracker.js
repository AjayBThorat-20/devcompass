// src/alerts/github-tracker.js
const https = require('https');

// Top 500+ npm packages organized by category
const TRACKED_REPOS = {
  // === WEB FRAMEWORKS (25) ===
  'react': 'facebook/react',
  'vue': 'vuejs/core',
  'angular': 'angular/angular',
  'svelte': 'sveltejs/svelte',
  'preact': 'preactjs/preact',
  'solid-js': 'solidjs/solid',
  'lit': 'lit/lit',
  'alpinejs': 'alpinejs/alpine',
  'ember.js': 'emberjs/ember.js',
  'backbone': 'jashkenas/backbone',
  'knockout': 'knockout/knockout',
  'marko': 'marko-js/marko',
  'mithril': 'MithrilJS/mithril.js',
  'hyperapp': 'jorgebucaran/hyperapp',
  'riot': 'riot/riot',
  'inferno': 'infernojs/inferno',
  'aurelia': 'aurelia/framework',
  'polymer': 'Polymer/polymer',
  'stimulus': 'hotwired/stimulus',
  'qwik': 'QwikDev/qwik',
  'astro': 'withastro/astro',
  'fresh': 'denoland/fresh',
  'marko': 'marko-js/marko',
  'htmx': 'bigskysoftware/htmx',
  'alpine': 'alpinejs/alpine',

  // === META FRAMEWORKS (15) ===
  'next': 'vercel/next.js',
  'nuxt': 'nuxt/nuxt',
  'gatsby': 'gatsbyjs/gatsby',
  'remix': 'remix-run/remix',
  'sveltekit': 'sveltejs/kit',
  'blitz': 'blitz-js/blitz',
  'redwood': 'redwoodjs/redwood',
  'nextra': 'shuding/nextra',
  'docusaurus': 'facebook/docusaurus',
  'vuepress': 'vuejs/vuepress',
  'eleventy': '11ty/eleventy',
  'hexo': 'hexojs/hexo',
  'hugo': 'gohugoio/hugo',
  'jekyll': 'jekyll/jekyll',
  'gridsome': 'gridsome/gridsome',

  // === MOBILE FRAMEWORKS (10) ===
  'react-native': 'facebook/react-native',
  'ionic': 'ionic-team/ionic-framework',
  'nativescript': 'NativeScript/NativeScript',
  'expo': 'expo/expo',
  'capacitor': 'ionic-team/capacitor',
  'cordova': 'apache/cordova',
  'framework7': 'framework7io/framework7',
  'onsen-ui': 'OnsenUI/OnsenUI',
  'quasar': 'quasarframework/quasar',
  'metro': 'facebook/metro',

  // === BACKEND FRAMEWORKS (20) ===
  'express': 'expressjs/express',
  'koa': 'koajs/koa',
  'fastify': 'fastify/fastify',
  'hapi': 'hapijs/hapi',
  'nest': 'nestjs/nest',
  'loopback': 'loopbackio/loopback-next',
  'sails': 'balderdashy/sails',
  'feathers': 'feathersjs/feathers',
  'adonis': 'adonisjs/core',
  'strapi': 'strapi/strapi',
  'meteor': 'meteor/meteor',
  'keystone': 'keystonejs/keystone',
  'directus': 'directus/directus',
  'payload': 'payloadcms/payload',
  'ghost': 'TryGhost/Ghost',
  'redwood': 'redwoodjs/redwood',
  'trpc': 'trpc/trpc',
  'graphql-yoga': 'dotansimha/graphql-yoga',
  'apollo-server': 'apollographql/apollo-server',
  'prisma': 'prisma/prisma',

  // === BUILD TOOLS (25) ===
  'webpack': 'webpack/webpack',
  'vite': 'vitejs/vite',
  'rollup': 'rollup/rollup',
  'parcel': 'parcel-bundler/parcel',
  'esbuild': 'evanw/esbuild',
  'turbopack': 'vercel/turbo',
  'swc': 'swc-project/swc',
  'babel': 'babel/babel',
  'rome': 'rome/tools',
  'tsup': 'egoist/tsup',
  'unbuild': 'unjs/unbuild',
  'microbundle': 'developit/microbundle',
  'tsdx': 'jaredpalmer/tsdx',
  'wmr': 'preactjs/wmr',
  'snowpack': 'FredKSchott/snowpack',
  'gulp': 'gulpjs/gulp',
  'grunt': 'gruntjs/grunt',
  'brunch': 'brunch/brunch',
  'browserify': 'browserify/browserify',
  'fuse-box': 'fuse-box/fuse-box',
  'poi': 'egoist/poi',
  'neutrino': 'neutrinojs/neutrino',
  'backpack': 'jaredpalmer/backpack',
  'ncc': 'vercel/ncc',
  'pkg': 'vercel/pkg',

  // === TESTING FRAMEWORKS (25) ===
  'jest': 'jestjs/jest',
  'mocha': 'mochajs/mocha',
  'jasmine': 'jasmine/jasmine',
  'vitest': 'vitest-dev/vitest',
  'ava': 'avajs/ava',
  'tape': 'tape-testing/tape',
  'cypress': 'cypress-io/cypress',
  'playwright': 'microsoft/playwright',
  'puppeteer': 'puppeteer/puppeteer',
  'selenium-webdriver': 'SeleniumHQ/selenium',
  'webdriverio': 'webdriverio/webdriverio',
  'nightwatch': 'nightwatchjs/nightwatch',
  'testcafe': 'DevExpress/testcafe',
  'karma': 'karma-runner/karma',
  'protractor': 'angular/protractor',
  'enzyme': 'enzymejs/enzyme',
  '@testing-library/react': 'testing-library/react-testing-library',
  '@testing-library/vue': 'testing-library/vue-testing-library',
  '@testing-library/angular': 'testing-library/angular-testing-library',
  'chai': 'chaijs/chai',
  'sinon': 'sinonjs/sinon',
  'supertest': 'ladjs/supertest',
  'nock': 'nock/nock',
  'mock-service-worker': 'mswjs/msw',
  'storybook': 'storybookjs/storybook',

  // === LINTERS & FORMATTERS (15) ===
  'eslint': 'eslint/eslint',
  'prettier': 'prettier/prettier',
  'stylelint': 'stylelint/stylelint',
  'tslint': 'palantir/tslint',
  'standard': 'standard/standard',
  'xo': 'xojs/xo',
  'jshint': 'jshint/jshint',
  'jslint': 'jslint-org/jslint',
  'rome': 'rome/tools',
  'dprint': 'dprint/dprint',
  'biome': 'biomejs/biome',
  'oxlint': 'web-infra-dev/oxc',
  'quick-lint-js': 'quick-lint/quick-lint-js',
  'rslint': 'rslint/rslint',
  'deno_lint': 'denoland/deno_lint',

  // === TYPESCRIPT & TYPE TOOLS (15) ===
  'typescript': 'microsoft/TypeScript',
  'ts-node': 'TypeStrong/ts-node',
  'tsx': 'privatenumber/tsx',
  'tsup': 'egoist/tsup',
  'tsc-watch': 'gilamran/tsc-watch',
  'ttypescript': 'cevek/ttypescript',
  'typedoc': 'TypeStrong/typedoc',
  'api-extractor': 'microsoft/rushstack',
  'type-fest': 'sindresorhus/type-fest',
  'zod': 'colinhacks/zod',
  'yup': 'jquense/yup',
  'joi': 'hapijs/joi',
  'ajv': 'ajv-validator/ajv',
  'superstruct': 'ianstormtaylor/superstruct',
  'runtypes': 'pelotom/runtypes',

  // === STATE MANAGEMENT (20) ===
  'redux': 'reduxjs/redux',
  'mobx': 'mobxjs/mobx',
  'zustand': 'pmndrs/zustand',
  'jotai': 'pmndrs/jotai',
  'recoil': 'facebookexperimental/Recoil',
  'valtio': 'pmndrs/valtio',
  'xstate': 'statelyai/xstate',
  'effector': 'effector/effector',
  'rematch': 'rematch/rematch',
  'easy-peasy': 'ctrlplusb/easy-peasy',
  'pullstate': 'lostpebble/pullstate',
  'hookstate': 'avkonst/hookstate',
  'storeon': 'storeon/storeon',
  'nano-stores': 'nanostores/nanostores',
  'valtio': 'pmndrs/valtio',
  'signal': 'preactjs/signals',
  'vuex': 'vuejs/vuex',
  'pinia': 'vuejs/pinia',
  'ngxs': 'ngxs/store',
  'akita': 'salesforce/akita',

  // === HTTP CLIENTS (20) ===
  'axios': 'axios/axios',
  'node-fetch': 'node-fetch/node-fetch',
  'got': 'sindresorhus/got',
  'ky': 'sindresorhus/ky',
  'superagent': 'ladjs/superagent',
  'request': 'request/request',
  'needle': 'tomas/needle',
  'bent': 'mikeal/bent',
  'phin': 'ethanent/phin',
  'undici': 'nodejs/undici',
  'cross-fetch': 'lquixada/cross-fetch',
  'isomorphic-fetch': 'matthew-andrews/isomorphic-fetch',
  'whatwg-fetch': 'github/fetch',
  'unfetch': 'developit/unfetch',
  'redaxios': 'developit/redaxios',
  '@tanstack/react-query': 'TanStack/query',
  'swr': 'vercel/swr',
  'apollo-client': 'apollographql/apollo-client',
  'urql': 'urql-graphql/urql',
  'relay': 'facebook/relay',

  // === UTILITIES (50) ===
  'lodash': 'lodash/lodash',
  'underscore': 'jashkenas/underscore',
  'ramda': 'ramda/ramda',
  'moment': 'moment/moment',
  'dayjs': 'iamkun/dayjs',
  'date-fns': 'date-fns/date-fns',
  'luxon': 'moment/luxon',
  'chalk': 'chalk/chalk',
  'colors': 'Marak/colors.js',
  'ora': 'sindresorhus/ora',
  'inquirer': 'SBoudrias/Inquirer.js',
  'prompts': 'terkelg/prompts',
  'commander': 'tj/commander.js',
  'yargs': 'yargs/yargs',
  'minimist': 'minimistjs/minimist',
  'dotenv': 'motdotla/dotenv',
  'cross-env': 'kentcdodds/cross-env',
  'uuid': 'uuidjs/uuid',
  'nanoid': 'ai/nanoid',
  'short-uuid': 'oculus42/short-uuid',
  'validator': 'validatorjs/validator.js',
  'is': 'enricomarino/is',
  'debug': 'debug-js/debug',
  'winston': 'winstonjs/winston',
  'pino': 'pinojs/pino',
  'bunyan': 'trentm/node-bunyan',
  'morgan': 'expressjs/morgan',
  'ms': 'vercel/ms',
  'glob': 'isaacs/node-glob',
  'minimatch': 'isaacs/minimatch',
  'micromatch': 'micromatch/micromatch',
  'fast-glob': 'mrmlnc/fast-glob',
  'chokidar': 'paulmillr/chokidar',
  'fs-extra': 'jprichardson/node-fs-extra',
  'rimraf': 'isaacs/rimraf',
  'del': 'sindresorhus/del',
  'make-dir': 'sindresorhus/make-dir',
  'execa': 'sindresorhus/execa',
  'shelljs': 'shelljs/shelljs',
  'cross-spawn': 'moxystudio/node-cross-spawn',
  'concurrently': 'open-cli-tools/concurrently',
  'npm-run-all': 'mysticatea/npm-run-all',
  'nodemon': 'remy/nodemon',
  'pm2': 'Unitech/pm2',
  'forever': 'foreversd/forever',
  'bluebird': 'petkaantonov/bluebird',
  'p-limit': 'sindresorhus/p-limit',
  'p-queue': 'sindresorhus/p-queue',
  'p-retry': 'sindresorhus/p-retry',
  'async': 'caolan/async',

  // === CSS & STYLING (25) ===
  'tailwindcss': 'tailwindlabs/tailwindcss',
  'sass': 'sass/dart-sass',
  'less': 'less/less.js',
  'stylus': 'stylus/stylus',
  'postcss': 'postcss/postcss',
  'autoprefixer': 'postcss/autoprefixer',
  'cssnano': 'cssnano/cssnano',
  'styled-components': 'styled-components/styled-components',
  'emotion': 'emotion-js/emotion',
  '@emotion/react': 'emotion-js/emotion',
  'styled-jsx': 'vercel/styled-jsx',
  'linaria': 'callstack/linaria',
  'vanilla-extract': 'vanilla-extract-css/vanilla-extract',
  'stitches': 'stitchesjs/stitches',
  'twin.macro': 'ben-rogerson/twin.macro',
  'css-modules': 'css-modules/css-modules',
  'classnames': 'JedWatson/classnames',
  'clsx': 'lukeed/clsx',
  'unocss': 'unocss/unocss',
  'windicss': 'windicss/windicss',
  'twind': 'tw-in-js/twind',
  'goober': 'cristianbote/goober',
  'fela': 'robinweser/fela',
  'aphrodite': 'Khan/aphrodite',
  'jss': 'cssinjs/jss',

  // === DOCUMENTATION (15) ===
  'jsdoc': 'jsdoc/jsdoc',
  'typedoc': 'TypeStrong/typedoc',
  'documentation': 'documentationjs/documentation',
  'esdoc': 'esdoc/esdoc',
  'docz': 'doczjs/docz',
  'react-docgen': 'reactjs/react-docgen',
  'compodoc': 'compodoc/compodoc',
  'api-documenter': 'microsoft/rushstack',
  'swagger-ui': 'swagger-api/swagger-ui',
  'redoc': 'Redocly/redoc',
  'slate': 'slatedocs/slate',
  'docsify': 'docsifyjs/docsify',
  'gitbook': 'GitbookIO/gitbook',
  'mkdocs': 'mkdocs/mkdocs',
  'sphinx': 'sphinx-doc/sphinx',

  // === DATABASE & ORM (20) ===
  'mongoose': 'Automattic/mongoose',
  'sequelize': 'sequelize/sequelize',
  'typeorm': 'typeorm/typeorm',
  'knex': 'knex/knex',
  'objection': 'Vincit/objection.js',
  'bookshelf': 'bookshelf/bookshelf',
  'waterline': 'balderdashy/waterline',
  'mikro-orm': 'mikro-orm/mikro-orm',
  'drizzle-orm': 'drizzle-team/drizzle-orm',
  'kysely': 'kysely-org/kysely',
  'mongodb': 'mongodb/node-mongodb-native',
  'pg': 'brianc/node-postgres',
  'mysql': 'mysqljs/mysql',
  'mysql2': 'sidorares/node-mysql2',
  'sqlite3': 'TryGhost/node-sqlite3',
  'better-sqlite3': 'WiseLibs/better-sqlite3',
  'redis': 'redis/node-redis',
  'ioredis': 'redis/ioredis',
  'cassandra-driver': 'datastax/nodejs-driver',
  'neo4j-driver': 'neo4j/neo4j-javascript-driver',

  // === GRAPHQL (15) ===
  'graphql': 'graphql/graphql-js',
  '@graphql-tools/schema': 'ardatan/graphql-tools',
  'graphql-yoga': 'dotansimha/graphql-yoga',
  'apollo-server-express': 'apollographql/apollo-server',
  'mercurius': 'mercurius-js/mercurius',
  'type-graphql': 'MichalLytek/type-graphql',
  'nexus': 'graphql-nexus/nexus',
  'pothos': 'hayes/pothos',
  'graphql-request': 'jasonkuhrt/graphql-request',
  'graphql-tag': 'apollographql/graphql-tag',
  'dataloader': 'graphql/dataloader',
  'graphql-subscriptions': 'apollographql/graphql-subscriptions',
  'graphql-ws': 'enisdenjo/graphql-ws',
  'subscriptions-transport-ws': 'apollographql/subscriptions-transport-ws',
  'graphql-shield': 'dimatill/graphql-shield',

  // === AUTHENTICATION (15) ===
  'passport': 'jaredhanson/passport',
  'jsonwebtoken': 'auth0/node-jsonwebtoken',
  'bcrypt': 'kelektiv/node.bcrypt.js',
  'bcryptjs': 'dcodeIO/bcrypt.js',
  'argon2': 'ranisalt/node-argon2',
  'oauth': 'ciaranj/node-oauth',
  'oauth2-server': 'oauthjs/node-oauth2-server',
  'next-auth': 'nextauthjs/next-auth',
  'lucia': 'lucia-auth/lucia',
  'iron-session': 'vvo/iron-session',
  'jose': 'panva/jose',
  'otplib': 'yeojz/otplib',
  'speakeasy': 'speakeasyjs/speakeasy',
  'node-2fa': 'jeremyscalpello/node-2fa',
  'Grant': 'simov/grant',

  // === VALIDATION (10) ===
  'joi': 'hapijs/joi',
  'yup': 'jquense/yup',
  'zod': 'colinhacks/zod',
  'ajv': 'ajv-validator/ajv',
  'superstruct': 'ianstormtaylor/superstruct',
  'io-ts': 'gcanti/io-ts',
  'runtypes': 'pelotom/runtypes',
  'valibot': 'fabian-hiller/valibot',
  'typia': 'samchon/typia',
  'arktype': 'arktypeio/arktype',

  // === REACTIVITY & SIGNALS (10) ===
  '@preact/signals': 'preactjs/signals',
  'solid-js': 'solidjs/solid',
  'mobx': 'mobxjs/mobx',
  'vue': 'vuejs/core',
  'rxjs': 'ReactiveX/rxjs',
  'most': 'mostjs/core',
  'kefir': 'kefirjs/kefir',
  'bacon': 'baconjs/bacon.js',
  'flyd': 'paldepind/flyd',
  'callbag': 'callbag/callbag',

  // === ANIMATION (10) ===
  'gsap': 'greensock/GSAP',
  'framer-motion': 'framer/motion',
  'react-spring': 'pmndrs/react-spring',
  'anime': 'juliangarnier/anime',
  'popmotion': 'Popmotion/popmotion',
  'velocity': 'julianshapiro/velocity',
  'mo-js': 'mojs/mojs',
  'lottie-web': 'airbnb/lottie-web',
  'three': 'mrdoob/three.js',
  'pixi.js': 'pixijs/pixijs',

  // === CHARTS & DATA VIZ (15) ===
  'chart.js': 'chartjs/Chart.js',
  'd3': 'd3/d3',
  'recharts': 'recharts/recharts',
  'victory': 'FormidableLabs/victory',
  'nivo': 'plouc/nivo',
  'visx': 'airbnb/visx',
  'plotly.js': 'plotly/plotly.js',
  'highcharts': 'highcharts/highcharts',
  'echarts': 'apache/echarts',
  'apexcharts': 'apexcharts/apexcharts.js',
  'react-chartjs-2': 'reactchartjs/react-chartjs-2',
  'vue-chartjs': 'apertureless/vue-chartjs',
  'chartist': 'chartist-js/chartist',
  'c3': 'c3js/c3',
  'billboard.js': 'naver/billboard.js',

  // === UI COMPONENT LIBRARIES (25) ===
  '@mui/material': 'mui/material-ui',
  'antd': 'ant-design/ant-design',
  'react-bootstrap': 'react-bootstrap/react-bootstrap',
  'semantic-ui-react': 'Semantic-Org/Semantic-UI-React',
  'chakra-ui': 'chakra-ui/chakra-ui',
  'mantine': 'mantinedev/mantine',
  'blueprint': 'palantir/blueprint',
  'evergreen': 'segmentio/evergreen',
  'fluent-ui': 'microsoft/fluentui',
  'carbon-components-react': 'carbon-design-system/carbon',
  'grommet': 'grommet/grommet',
  'rebass': 'rebassjs/rebass',
  'theme-ui': 'system-ui/theme-ui',
  'radix-ui': 'radix-ui/primitives',
  'headlessui': 'tailwindlabs/headlessui',
  'daisyui': 'saadeghi/daisyui',
  'nextui': 'nextui-org/nextui',
  'shadcn-ui': 'shadcn-ui/ui',
  'primereact': 'primefaces/primereact',
  'vuetify': 'vuetifyjs/vuetify',
  'quasar': 'quasarframework/quasar',
  'element-plus': 'element-plus/element-plus',
  'naive-ui': 'tusen-ai/naive-ui',
  'arco-design': 'arco-design/arco-design',
  'semi-design': 'DouyinFE/semi-design',

  // === FORM LIBRARIES (10) ===
  'react-hook-form': 'react-hook-form/react-hook-form',
  'formik': 'jaredpalmer/formik',
  'final-form': 'final-form/final-form',
  'redux-form': 'redux-form/redux-form',
  'react-final-form': 'final-form/react-final-form',
  'vee-validate': 'logaretm/vee-validate',
  'vue-formulate': 'wearebraid/vue-formulate',
  'unform': 'unform/unform',
  'informed': 'teslamotors/informed',
  'formsy-react': 'formsy/formsy-react',

  // === ROUTING (10) ===
  'react-router': 'remix-run/react-router',
  'vue-router': 'vuejs/router',
  'wouter': 'molefrog/wouter',
  'reach-router': 'reach/router',
  'universal-router': 'kriasoft/universal-router',
  'navigo': 'krasimir/navigo',
  'page': 'visionmedia/page.js',
  'director': 'flatiron/director',
  'routify': 'roxiness/routify',
  'tanstack-router': 'TanStack/router',

  // === FILE UPLOAD (8) ===
  'multer': 'expressjs/multer',
  'formidable': 'node-formidable/formidable',
  'busboy': 'mscdex/busboy',
  'multiparty': 'pillarjs/multiparty',
  'express-fileupload': 'richardgirges/express-fileupload',
  'react-dropzone': 'react-dropzone/react-dropzone',
  'uppy': 'transloadit/uppy',
  'filepond': 'pqina/filepond',

  // === MARKDOWN & RICH TEXT (12) ===
  'markdown-it': 'markdown-it/markdown-it',
  'marked': 'markedjs/marked',
  'remark': 'remarkjs/remark',
  'rehype': 'rehypejs/rehype',
  'gray-matter': 'jonschlinkert/gray-matter',
  'unified': 'unifiedjs/unified',
  'mdx': 'mdx-js/mdx',
  'slate': 'ianstormtaylor/slate',
  'draft-js': 'facebook/draft-js',
  'prosemirror': 'ProseMirror/prosemirror',
  'tiptap': 'ueberdosis/tiptap',
  'quill': 'slab/quill',

  // === IMAGE PROCESSING (10) ===
  'sharp': 'lovell/sharp',
  'jimp': 'jimp-dev/jimp',
  'canvas': 'Automattic/node-canvas',
  'gm': 'aheckmann/gm',
  'imagemin': 'imagemin/imagemin',
  'pica': 'nodeca/pica',
  'blurhash': 'woltapp/blurhash',
  'qrcode': 'soldair/node-qrcode',
  'svg-captcha': 'produck/svg-captcha',
  'pdf-lib': 'Hopding/pdf-lib',

  // === EMAIL (8) ===
  'nodemailer': 'nodemailer/nodemailer',
  'emailjs': 'eleith/emailjs',
  'sendgrid': 'sendgrid/sendgrid-nodejs',
  'mailgun-js': 'mailgun/mailgun-js',
  'postmark': 'wildbit/postmark.js',
  'mjml': 'mjmlio/mjml',
  'react-email': 'resend/react-email',
  'handlebars': 'handlebars-lang/handlebars.js',

  // === WEBSOCKETS (8) ===
  'ws': 'websockets/ws',
  'socket.io': 'socketio/socket.io',
  'sockjs': 'sockjs/sockjs-node',
  'uWebSockets.js': 'uNetworking/uWebSockets.js',
  'faye-websocket': 'faye/faye-websocket-node',
  'websocket': 'theturtle32/WebSocket-Node',
  'reconnecting-websocket': 'pladaria/reconnecting-websocket',
  'pusher-js': 'pusher/pusher-js',

  // === COMPRESSION (6) ===
  'compression': 'expressjs/compression',
  'pako': 'nodeca/pako',
  'brotli': 'google/brotli',
  'zlib': 'nodejs/node',
  'tar': 'npm/node-tar',
  'archiver': 'archiverjs/node-archiver',

  // === SECURITY (10) ===
  'helmet': 'helmetjs/helmet',
  'cors': 'expressjs/cors',
  'csurf': 'expressjs/csurf',
  'express-rate-limit': 'express-rate-limit/express-rate-limit',
  'express-validator': 'express-validator/express-validator',
  'sanitize-html': 'apostrophecms/sanitize-html',
  'dompurify': 'cure53/DOMPurify',
  'xss': 'leizongmin/js-xss',
  'hpp': 'analog-nico/hpp',
  'toobusy-js': 'STRML/node-toobusy',

  // === CLI TOOLS (15) ===
  'commander': 'tj/commander.js',
  'yargs': 'yargs/yargs',
  'inquirer': 'SBoudrias/Inquirer.js',
  'prompts': 'terkelg/prompts',
  'enquirer': 'enquirer/enquirer',
  'ora': 'sindresorhus/ora',
  'chalk': 'chalk/chalk',
  'boxen': 'sindresorhus/boxen',
  'figures': 'sindresorhus/figures',
  'cli-table3': 'cli-table/cli-table3',
  'progress': 'visionmedia/node-progress',
  'listr': 'SamVerschueren/listr',
  'blessed': 'chjj/blessed',
  'ink': 'vadimdemedes/ink',
  'oclif': 'oclif/oclif',

  // === PERFORMANCE & MONITORING (10) ===
  'clinic': 'clinicjs/node-clinic',
  'autocannon': 'mcollina/autocannon',
  'benchmark': 'bestiejs/benchmark.js',
  'prom-client': 'siimon/prom-client',
  'hot-shots': 'brightcove/hot-shots',
  'node-statsd': 'sivy/node-statsd',
  'lightship': 'gajus/lightship',
  'express-status-monitor': 'RafalWilinski/express-status-monitor',
  'appmetrics': 'RuntimeTools/appmetrics',
  'newrelic': 'newrelic/node-newrelic',

  // === MISCELLANEOUS POPULAR (20) ===
  'cheerio': 'cheeriojs/cheerio',
  'jsdom': 'jsdom/jsdom',
  'xml2js': 'Leonidas-from-XIV/node-xml2js',
  'csv-parse': 'adaltas/node-csv',
  'papaparse': 'mholt/PapaParse',
  'pdf-parse': 'modesty/pdf-parse',
  'docxtemplater': 'open-xml-templating/docxtemplater',
  'slugify': 'simov/slugify',
  'url-slug': 'stldo/url-slug',
  'helmet': 'helmetjs/helmet',
  'cookie-parser': 'expressjs/cookie-parser',
  'body-parser': 'expressjs/body-parser',
  'serve-static': 'expressjs/serve-static',
  'serve-favicon': 'expressjs/serve-favicon',
  'method-override': 'expressjs/method-override',
  'connect': 'senchalabs/connect',
  'path-to-regexp': 'pillarjs/path-to-regexp',
  'qs': 'ljharb/qs',
  'mime': 'broofa/mime',
  'content-type': 'jshttp/content-type',
};

/**
 * Fetch GitHub issues for a package
 */
async function fetchGitHubIssues(packageName) {
  const repo = TRACKED_REPOS[packageName];
  
  if (!repo) {
    return null; // Not tracked
  }
  
  try {
    const data = await makeGitHubRequest(`/repos/${repo}/issues`, {
      state: 'open',
      per_page: 100,
      labels: 'bug'
    });
    
    return analyzeIssues(data, packageName);
  } catch (error) {
    console.error(`GitHub API error for ${packageName}:`, error.message);
    return null;
  }
}

/**
 * Make GitHub API request
 */
function makeGitHubRequest(path, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');
    
    const options = {
      hostname: 'api.github.com',
      path: `${path}?${queryString}`,
      method: 'GET',
      headers: {
        'User-Agent': 'DevCompass',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Analyze issues to detect trends
 */
function analyzeIssues(issues, packageName) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  // Count issues by recency
  const last7Days = issues.filter(i => 
    (now - new Date(i.created_at).getTime()) < 7 * day
  ).length;
  
  const last30Days = issues.filter(i => 
    (now - new Date(i.created_at).getTime()) < 30 * day
  ).length;
  
  // Detect critical issues (high priority labels)
  const criticalLabels = ['critical', 'security', 'regression', 'breaking'];
  const criticalIssues = issues.filter(issue => 
    issue.labels.some(label => 
      criticalLabels.some(critical => 
        label.name.toLowerCase().includes(critical)
      )
    )
  );
  
  // Calculate risk score
  let riskScore = 0;
  if (last7Days > 15) riskScore += 3;
  else if (last7Days > 10) riskScore += 2;
  else if (last7Days > 5) riskScore += 1;
  
  if (criticalIssues.length > 5) riskScore += 2;
  else if (criticalIssues.length > 2) riskScore += 1;
  
  return {
    package: packageName,
    totalIssues: issues.length,
    last7Days,
    last30Days,
    criticalIssues: criticalIssues.length,
    riskScore,
    trend: determineTrend(last7Days, last30Days),
    repoUrl: `https://github.com/${TRACKED_REPOS[packageName]}`
  };
}

/**
 * Determine trend (increasing/stable/decreasing)
 */
function determineTrend(last7Days, last30Days) {
  const weeklyAverage = last30Days / 4;
  
  if (last7Days > weeklyAverage * 1.5) {
    return 'increasing';
  } else if (last7Days < weeklyAverage * 0.5) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Check GitHub issues for multiple packages (OPTIMIZED)
 */
async function checkGitHubIssues(packages) {
  const results = [];
  const packageNames = Object.keys(packages);
  
  // Only check packages that are tracked AND installed
  const trackedAndInstalled = packageNames.filter(pkg => TRACKED_REPOS[pkg]);
  
  if (trackedAndInstalled.length === 0) {
    return results;
  }
  
  // Process in batches to avoid rate limits
  for (const packageName of trackedAndInstalled) {
    const result = await fetchGitHubIssues(packageName);
    
    if (result) {
      results.push(result);
    }
    
    // Rate limit: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Get total count of tracked packages
 */
function getTrackedPackageCount() {
  return Object.keys(TRACKED_REPOS).length;
}

/**
 * Get tracked packages by category (for documentation)
 */
function getTrackedPackagesByCategory() {
  return {
    'Web Frameworks': 25,
    'Meta Frameworks': 15,
    'Mobile Frameworks': 10,
    'Backend Frameworks': 20,
    'Build Tools': 25,
    'Testing': 25,
    'Linters & Formatters': 15,
    'TypeScript Tools': 15,
    'State Management': 20,
    'HTTP Clients': 20,
    'Utilities': 50,
    'CSS & Styling': 25,
    'Documentation': 15,
    'Database & ORM': 20,
    'GraphQL': 15,
    'Authentication': 15,
    'Validation': 10,
    'Reactivity': 10,
    'Animation': 10,
    'Charts & Visualization': 15,
    'UI Libraries': 25,
    'Forms': 10,
    'Routing': 10,
    'File Upload': 8,
    'Markdown & Rich Text': 12,
    'Image Processing': 10,
    'Email': 8,
    'WebSockets': 8,
    'Compression': 6,
    'Security': 10,
    'CLI Tools': 15,
    'Performance': 10,
    'Miscellaneous': 20
  };
}

module.exports = {
  checkGitHubIssues,
  fetchGitHubIssues,
  TRACKED_REPOS,
  getTrackedPackageCount,
  getTrackedPackagesByCategory
};