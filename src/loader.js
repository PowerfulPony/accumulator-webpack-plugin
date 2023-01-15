const { readFile } = require('fs');
const { createHash } = require('crypto');

function loader() {
  const complete = this.async();
  const {
    resourcePath,
    regModule,
    metaModulePath,
  } = this;

  readFile(resourcePath, (err, data) => {
    if (err) throw new Error(err);

    const shortHash = createHash('md5')
      .update(data)
      .digest('hex')
      .substring(0, 7);

    regModule({
      hash: shortHash,
      path: resourcePath,
    });

    complete(null, `"use strict";
const meta = require(${JSON.stringify(metaModulePath)});
const instance = meta.getData(${JSON.stringify(shortHash)});
module.exports = instance;`);
  });
}

module.exports = loader;
