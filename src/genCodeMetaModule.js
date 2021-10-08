function genCodeMetaModule(index, artifactPath) {
  return `"use strict";
const artifact = require(${JSON.stringify(artifactPath)});
const index = ${JSON.stringify(index, null, 2)};
module.exports = {
  artifact,
  index,
  getData(hash) {
    return index[hash];
  }
}`;
}

module.exports = genCodeMetaModule;
