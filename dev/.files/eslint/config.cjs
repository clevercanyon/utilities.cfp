/**
 * ESLint config file.
 *
 * @note ESLint is not aware of this config file's location.
 *
 * @see https://eslint.org/docs/latest/user-guide/configuring
 * @see https://typescript-eslint.io/docs/linting/typed-linting/monorepos
 * @see https://eslint.org/docs/latest/user-guide/command-line-interface
 *
 * @note Testing: `$ npx eslint --print-config [file-to-lint]`.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * This entire file will be updated automatically.
 * - Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 */
/* eslint-env es2021, node */

let commonExtends       = [];
let commonPlugins       = [];
let commonParserOptions = {};
let commonSettings      = {};
let commonRules         = {};

const path = require( 'node:path' );
const fs   = require( 'node:fs' );

const projDir = path.resolve( __dirname, '../../..' );
const pkg     = JSON.parse( fs.readFileSync( path.resolve( projDir, './package.json' ) ) );

module.exports = {
	extends        : ( commonExtends = [
		'eslint:recommended',
		'plugin:import/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:jsx-a11y/recommended',
	] ),
	root           : true,
	env            : { es2021 : true },
	plugins        : ( commonPlugins = [
		'import',
		'react',
		'react-hooks',
		'jsx-a11y',
	] ),
	ignorePatterns : [
		'!**/.*',
		'**/dist/**',
		'**/node_modules/**',
	],
	parser         : 'espree', // Default.
	parserOptions  : ( commonParserOptions = {
		ecmaVersion  : 2021,
		ecmaFeatures : {
			jsx           : true,
			impliedStrict : true,
		},
		sourceType   : pkg.type || 'script',
	} ),
	settings       : ( commonSettings = {} ),
	rules          : ( commonRules = {
		'prefer-rest-params'        : [ 'off' ],
		'space-unary-ops'           : [
			'warn',
			{
				words     : true,
				nonwords  : true,
				overrides : {
					'-'  : false,
					'+'  : false,
					'--' : false,
					'++' : false,
				},
			},
		],
		'space-in-parens'           : [ 'warn', 'always' ],
		'array-bracket-spacing'     : [ 'warn', 'always' ],
		'object-curly-spacing'      : [ 'warn', 'always' ],
		'computed-property-spacing' : [ 'warn', 'always' ],
		'no-empty'                  : [ 'warn', { allowEmptyCatch : true } ],
	} ),
	overrides      : [
		{
			files         : [ '**/*.{tsx,ts}' ],
			extends       : [
				...commonExtends,
				'plugin:import/typescript',
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
			],
			plugins       : [
				...commonPlugins,
				'@typescript-eslint',
			],
			parser        :
				'@typescript-eslint/parser',
			parserOptions : {
				...commonParserOptions,
				requireConfigFile : true,
				project           : [ '**/tsconfig.json' ],
			},
			settings      : {
				...commonSettings,
				'import/parsers'  : {
					'@typescript-eslint/parser' : [ '.tsx', '.ts' ],
				},
				'import/resolver' : {
					typescript : {
						alwaysTryTypes : true,
						project        : [ '**/tsconfig.json' ],
					},
				},
			},
			rules         : {
				...commonRules,
				'@typescript-eslint/require-await'          : [ 'off' ],
				'@typescript-eslint/no-empty-interface'     : [ 'off' ],
				'@typescript-eslint/no-inferrable-types'    : [ 'off' ],
				'@typescript-eslint/ban-ts-comment'         : [
					'warn', {
						'ts-check'        : 'allow-with-description',
						'ts-nocheck'      : 'allow-with-description',
						'ts-expect-error' : 'allow-with-description',
						'ts-ignore'       : 'allow-with-description',
					},
				],
				'@typescript-eslint/triple-slash-reference' : [ 'warn', { 'path' : 'never', 'types' : 'always', 'lib' : 'always' } ],
			},
		},
	],
};
