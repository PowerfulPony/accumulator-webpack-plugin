const Plugin = require('./Plugin');
const { packageName } = require('./const');

const loaderPath = require.resolve('./loader.js');

module.exports = {
  Plugin,
  loaderPath,
  packageName,
};
