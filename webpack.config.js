// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    context: __dirname,
    entry: { 
        main: [
            './app/js/main.js',
            './app/js/vendor/unmute.js'
        ],
        replay_gpx: [
            './app/js/replay.js',
        ]
    },
    devServer: {
        open: true,
    },
    output: {
        path: path.resolve(__dirname, 'dist'),  //outputs the file 'bundle.js' to the folder 'dist'
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'index.html', to: 'index.html' },
                { from: 'replay_gpx.html', to: 'replay_gpx.html' },
            ],
        }),
    ],
};
