// webpack.config.js
const path = require('path');

module.exports = {
    mode: 'production',
    context: __dirname,
    entry: { 
        main: [
            './app/js/webpack/leaflet.js',      //sets entry points for webpack to combine these js files into one
            './app/js/webpack/turf.js',
            './app/js/main.js',
            './app/js/vendor/unmute.js'
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),  //outputs the file 'bundle.js' to the folder 'dist'
        filename: 'bundle.js',
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
            }
        ]
    }
};
