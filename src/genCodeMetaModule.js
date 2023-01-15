function genCodeMetaModule(index, artifactPath, time) {
  return `"use strict";
let time = "";
if (module.hot) {
  module.hot.accept();
  time = "${time}";
}
const artifact = require(${JSON.stringify(artifactPath)});
const index = ${JSON.stringify(index, null, 2)};
module.exports = {
  time,
  artifact,
  index,
  getData(hash) {
    return index[hash];
  },
}`;
}

module.exports = genCodeMetaModule;
