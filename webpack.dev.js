const path = require('path');

module.exports = {
    entry: {
        entry: './bin/www.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        publicPath: '/',
        clean: true,
    },
    mode: 'development',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.js$/,
                // exclude: /node_modules/,
                loader: 'babel-loader',
            }
        ]
    }
}