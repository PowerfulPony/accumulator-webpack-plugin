const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const {
  Plugin: AccumulatorWebpackPlugin,
  loaderPath: accumulatorWebpackPluginLoader,
} = require('../src/index');

module.exports = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    hot: true,
  },
  module: {
    rules: [
      {
        test: /.txt$/,
        loader: accumulatorWebpackPluginLoader,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Example',
    }),
    new AccumulatorWebpackPlugin(),
  ],
};
