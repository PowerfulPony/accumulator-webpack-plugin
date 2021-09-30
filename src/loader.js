const { readFile } = require('fs');
const { createHash } = require('crypto');

const { metaModuleName } = require('./const');

function loader() {
  const complete = this.async();
  const {
    resourcePath,
    regModule,
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

    complete(null, `module.exports = require('${metaModuleName}').getData('${shortHash}');`);
  });
}

module.exports = loader;
