const { env } = require('process');

module.exports = (config) => {
    config.set({
        files: [
            {
                included: false,
                pattern: '../../src/**',
                served: true,
                watched: true
            },
            '../../test/unit/**/*.js'
        ],

        frameworks: ['leche', 'mocha', 'sinon-chai'],

        preprocessors: {
            '../../test/unit/**/*.js': 'webpack'
        },

        webpack: {
            mode: 'development',
            module: {
                rules: [
                    {
                        test: /\.ts?$/,
                        use: {
                            loader: 'ts-loader'
                        }
                    }
                ]
            },
            resolve: {
                extensions: ['.js', '.ts']
            }
        },

        webpackMiddleware: {
            noInfo: true
        }
    });

    if (env.TRAVIS) {
        config.set({
            browsers: ['ChromeSauceLabs', 'FirefoxSauceLabs', 'SafariSauceLabs'],

            captureTimeout: 120000,

            customLaunchers: {
                ChromeSauceLabs: {
                    base: 'SauceLabs',
                    browserName: 'chrome',
                    platform: 'macOS 10.13'
                },
                FirefoxSauceLabs: {
                    base: 'SauceLabs',
                    browserName: 'firefox',
                    platform: 'macOS 10.13'
                },
                SafariSauceLabs: {
                    base: 'SauceLabs',
                    browserName: 'safari',
                    platform: 'macOS 10.13'
                }
            },

            tunnelIdentifier: env.TRAVIS_JOB_NUMBER
        });
    } else {
        config.set({
            browsers: ['ChromeHeadless', 'ChromeCanaryHeadless', 'FirefoxHeadless', 'FirefoxDeveloperHeadless', 'Safari']
        });
    }
};
