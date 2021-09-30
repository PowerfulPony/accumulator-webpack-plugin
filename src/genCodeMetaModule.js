function genCodeMetaModule(register) {
  return `"use strict";
const register = ${JSON.stringify(register, null, 2)};
module.exports = {
  register,
  getData(hash) {
    return register[hash];
  }
}`;
}

module.exports = genCodeMetaModule;
