const VirtualModulesPlugin = require('webpack-virtual-modules');
const NormalModule = require('webpack/lib/NormalModule');
const { ReplaceSource } = require('webpack-sources');

const genCodeMetaModule = require('./genCodeMetaModule');
const {
  NAMESPACE,
  metaModuleName,
} = require('./const');

class AccumulatorWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
    this.register = {};

    this.virtualModules = undefined;

    this.regModule = this.regModule.bind(this);
    this.genMetaModule = this.genMetaModule.bind(this);
    this.updateNeeded = false;

    this.metaModuleName = metaModuleName;
    this.metaModulePath = `node_modules/${metaModuleName}.js`;
  }

  regModule({ hash, path }) {
    this.register[hash] = path;
    this.updateNeeded = true;
  }

  methodsConvey(loaderContext) {
    loaderContext.regModule = this.regModule;
  }

  genMetaModule() {
    return genCodeMetaModule(this.register);
  }

  writeVirtualModule() {
    this.virtualModules.writeModule(this.metaModulePath, this.genMetaModule());
  }

  findMetaModule(compilation) {
    return Array.from(compilation.modules)
      .filter((module) => module.rawRequest === this.metaModuleName)[0];
  }

  updateMetaModule(compilation, complete) {
    const metaModule = this.findMetaModule(compilation);
    if (!(metaModule._source instanceof ReplaceSource)) {
      metaModule._source = new ReplaceSource(metaModule._source);
    } else {
      metaModule._source._replacements = [];
    }
    metaModule._source.replace(0, metaModule._source.source().length, this.genMetaModule());

    if (this.updateNeeded) {
      this.writeVirtualModule();
      this.updateNeeded = false;
    }

    complete();
  }

  hooked(compilation) {
    NormalModule.getCompilationHooks(compilation).loader
      .tap(NAMESPACE, (loaderContext) => this.methodsConvey(loaderContext));

    compilation.hooks.finishModules
      .tapAsync(NAMESPACE, (modules, complete) => {
        this.updateMetaModule(compilation, complete);
      });
  }

  apply(compiler) {
    this.virtualModules = new VirtualModulesPlugin({
      [this.metaModulePath]: this.genMetaModule(),
    });
    this.virtualModules.apply(compiler);

    compiler.hooks.thisCompilation.tap(NAMESPACE, (compilation) => { this.hooked(compilation); });
  }
}

module.exports = AccumulatorWebpackPlugin;
