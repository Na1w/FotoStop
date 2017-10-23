const ClosureCompilerPlugin = require('webpack-closure-compiler');


module.exports = {
    entry: './app.js',
    output: {
        filename: 'bundle.js'
    },
    plugins: [
        new ClosureCompilerPlugin({
            compiler: {
            //    jar: 'path/to/your/custom/compiler.jar', //optional
                language_in: 'ECMASCRIPT6',
                language_out: 'ECMASCRIPT5',
                compilation_level: 'ADVANCED'
            },
            concurrency: 3,
        })
    ]
}

