/*eslint no-var:0, object-shorthand:0 */
const path = require('path')

var coverage = String(process.env.COVERAGE)!=='false',
	ci = String(process.env.CI).match(/^(1|true)$/gi),
	pullRequest = !String(process.env.TRAVIS_PULL_REQUEST).match(/^(0|false|undefined)$/gi),
	masterBranch = String(process.env.TRAVIS_BRANCH).match(/^master$/gi),
	realBrowser = String(process.env.BROWSER).match(/^(1|true)$/gi),
	sauceLabs = realBrowser && ci && !pullRequest && masterBranch,
	performance = !coverage && !realBrowser && String(process.env.PERFORMANCE)!=='false',
	webpack = require('webpack');

var sauceLabsLaunchers = {
	sl_chrome: {
		base: 'SauceLabs',
		browserName: 'chrome',
		platform: 'Windows 10'
	},
	sl_firefox: {
		base: 'SauceLabs',
		browserName: 'firefox',
		platform: 'Windows 10'
	},
	sl_safari: {
		base: 'SauceLabs',
		browserName: 'safari',
		platform: 'OS X 10.11'
	},
	sl_edge: {
		base: 'SauceLabs',
		browserName: 'MicrosoftEdge',
		platform: 'Windows 10'
	},
	sl_ie_11: {
		base: 'SauceLabs',
		browserName: 'internet explorer',
		version: '11.103',
		platform: 'Windows 10'
	},
	sl_ie_10: {
		base: 'SauceLabs',
		browserName: 'internet explorer',
		version: '10.0',
		platform: 'Windows 7'
	},
	sl_ie_9: {
		base: 'SauceLabs',
		browserName: 'internet explorer',
		version: '9.0',
		platform: 'Windows 7'
	}
};

var travisLaunchers = {
	chrome_travis: {
		base: 'Chrome',
		flags: ['--no-sandbox']
	}
};

var localBrowsers = realBrowser ? Object.keys(travisLaunchers) : ['PhantomJS'];

module.exports = function(config) {
	config.set({
		browsers: sauceLabs ? Object.keys(sauceLabsLaunchers) : localBrowsers, //['Chrome'],

		frameworks: ['mocha', 'chai-sinon'],

		reporters: ['mocha'].concat(
            sauceLabs ? 'saucelabs' : [],
			coverage ? 'coverage-istanbul' : []
		),
		mochaReporter: {
			showDiff: true
		},

		browserLogOptions: { terminal: true },
		browserConsoleLogOptions: { terminal: true },

		browserNoActivityTimeout: 5 * 60 * 1000,

		// Use only two browsers concurrently, works better with open source Sauce Labs remote testing
		concurrency: 2,

		// sauceLabs: {
		// 	tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER || ('local'+require('./package.json').version),
		// 	startConnect: false
		// },

		customLaunchers: sauceLabs ? sauceLabsLaunchers : travisLaunchers,

		files: [
			{ pattern: 'polyfills.js', watched: false },
			{ pattern: '{browser,shared,compat}/**.js', watched: false }
		],

		preprocessors: {
			'**/*': ['webpack', 'sourcemap']
		},

		webpack: {
			devtool: 'inline-source-map',
			module: {
				/* Transpile source and test files */
				rules: [
					{
						enforce: 'pre',
						test: /\.jsx?$/,
						exclude: /node_modules/,
                        loader: 'babel-loader'
                        // options: {
                        //     presets: [
						// 		['es2015', { loose:true }],
						// 		'stage-0',
						// 		'react'
						// 	],
                        //     // "presets": [
                        //     // ["env", {
                        //     //     "loose": true,
                        //     //     "exclude": ["transform-es2015-typeof-symbol"],
                        //     //     "targets": {
                        //     //         "browsers": ["last 2 versions", "IE >= 9"]
                        //     //     }
                        //     // }]
                        //     // ],
                        //     "plugins": [
                        //         "transform-object-rest-spread",
                        //         "transform-react-jsx"
                        //     ]
                        // }
                    },
                    {
                        test: /\.ts$/,
                        loader: "ts-loader"
                    },
					/* Only Instrument our source files for coverage */
					coverage ?
                    {
                        test: /\.jsx?$/,
                        use: 'istanbul-instrumenter-loader',
                        include:  /build/,
                        exclude: /node_modules/
                    }: {}
				]
			},
			resolve: {
                alias: {
                    'zreact-compat': path.join(__dirname, '../build/compat.js'),
                    zreact: path.join(__dirname, '../build/zreact.js')
                },
				modules: [__dirname, 'node_modules']
			},
			plugins: [
				new webpack.DefinePlugin({
					coverage: coverage,
					// NODE_ENV: JSON.stringify(process.env.NODE_ENV || ''),
					ENABLE_PERFORMANCE: performance,
					DISABLE_FLAKEY: !!String(process.env.FLAKEY).match(/^(0|false)$/gi)
				})
			],
			mode: process.env.NODE_ENV || "development"
		},

		webpackMiddleware: {
			noInfo: true
        },
        coverageIstanbulReporter: {
            reports: ['json', 'text-summary'],//'html', 'lcovonly', 'text-summary', 'json'],
            dir: 'test/coverage',
			fixWebpackSourcePaths: true
		}
	});
};
