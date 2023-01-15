const { resolve } = require('path');
const { Buffer } = require('buffer');
const fs = require('fs/promises');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const {
  Plugin: AccumulatorWebpackPlugin,
  loaderPath: accumulatorWebpackPluginLoader,
} = require('../src/index');

const metaFilename = 'meta.js';
const artifactFilename = 'artifact.txt';
const artifactReg = new RegExp(`${artifactFilename}$`);

module.exports = {
  devtool: 'source-map',
  entry: resolve(__dirname, 'index.js'),
  output: {
    filename: 'main.js',
    path: resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    static: resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /.txt$/,
        exclude: artifactReg,
        loader: accumulatorWebpackPluginLoader,
      },
      {
        test: /.txt$/,
        include: artifactReg,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Example',
    }),
    new AccumulatorWebpackPlugin({
      metaFilename,
      artifactFilename,
      accumulate(register) {
        const reads = register
          .map(({ hash, path }) => fs.readFile(path)
            .then((buffer) => ({
              hash,
              path,
              buffer,
            })));

        return Promise.all(reads)
          .then((items) => {
            const index = {};
            let offset = 0;
            const buffer = Buffer.concat(items.map((item) => {
              index[item.hash] = {
                path: item.path,
                pos: offset,
                len: item.buffer.length,
              };
              offset += item.buffer.length;
              return item.buffer;
            }));

            return { index, buffer };
          });
      },
    }),
  ],
};
