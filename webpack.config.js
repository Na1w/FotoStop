const ClosureCompilerPlugin = require('webpack-closure-compiler');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');


module.exports = {
    entry: './src/app.js',
    output: {
        path: path.resolve(__dirname, 'bin'),
        filename: 'bundle.js'
    },
    module: {
        loaders:[
            { test: /\.png$/, loader: "url-loader?mimetype=image/png" }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'src/assets', to: 'assets'}
        ]),
        new HtmlWebpackPlugin({
            title: 'Fotoshop KreativeKlod 0.5',
            template: 'src/index.ejs' // Load a custom template (ejs by default see the FAQ for details)
        }),
        new ClosureCompilerPlugin({
            compiler: {
            //    jar: 'path/to/your/custom/compiler.jar', //optional
                language_in: 'ECMASCRIPT6',
                language_out: 'ECMASCRIPT5',
                compilation_level: 'ADVANCED',
            },
            concurrency: 3,
        })
    ]
}

