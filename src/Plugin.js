const { Buffer } = require('buffer');
const NormalModule = require('webpack/lib/NormalModule');
const { ReplaceSource, RawSource } = require('webpack-sources');
const VirtualModulesPlugin = require('webpack-virtual-modules');

const loaderPath = require.resolve('./loader.js');
const genCodeMetaModule = require('./genCodeMetaModule');
const {
  NAMESPACE,
  packageName,
} = require('./const');

class AccumulatorWebpackPlugin {
  constructor(options = {}) {
    this.register = [];
    this.index = {};
    this.virtualModules = undefined;

    this.options = options;
    this.accumulate = options.accumulate;
    this.metaFilename = options.metaFilename;
    this.artifactFilename = options.artifactFilename;

    this.regModule = this.regModule.bind(this);
    this.genMetaModule = this.genMetaModule.bind(this);
    this.updateNeeded = false;

    this.metaModulePath = `${packageName}/${this.metaFilename}`;
    this.artifactModulePath = `${packageName}/${this.artifactFilename}`;
  }

  regModule({ hash, path }) {
    this.register.push({
      path,
      hash,
      use: true,
    });

    this.updateNeeded = true;
  }

  getUsesModule() {
    return this.register.filter((item) => item.use);
  }

  methodsConvey(loaderContext) {
    loaderContext.regModule = this.regModule;
    loaderContext.metaModulePath = this.metaModulePath;
  }

  genMetaModule() {
    return genCodeMetaModule(this.index, this.artifactModulePath);
  }

  writeVirtualModule() {
    this.virtualModules.writeModule(`node_modules/${this.metaModulePath}`, this.genMetaModule());
  }

  findMetaModule(compilation) {
    return Array.from(compilation.modules)
      .filter((module) => !!this.metaModulePath.match(module.rawRequest))[0];
  }

  findArtifactModule(compilation) {
    return Array.from(compilation.modules)
      .filter((module) => !!this.artifactModulePath.match(module.rawRequest))[0];
  }

  updateMetaModule(compilation, complete) {
    const metaModule = this.findMetaModule(compilation);
    if (!(metaModule._source instanceof ReplaceSource)) {
      metaModule._source = new ReplaceSource(metaModule._source);
    } else {
      metaModule._source._replacements = [];
    }

    this.accumulate(this.getUsesModule())
      .then(({ index, buffer }) => {
        this.index = index;

        metaModule._source.replace(0, metaModule._source.source().length, this.genMetaModule());

        if (this.updateNeeded) {
          this.writeVirtualModule();
          this.updateNeeded = false;
        }

        const artifactModule = this.findArtifactModule(compilation);
        artifactModule._source = new RawSource(buffer);
        this.virtualModules.writeModule(`node_modules/${this.artifactModulePath}`, buffer);

        complete();
      });
  }

  registerUpdate(compilation) {
    const uses = Array.from(compilation.modules)
      .filter(({ loaders }) => loaders.find((loader) => loader.loader === loaderPath))
      .map(({ resource }) => resource);

    this.register.forEach((regItem) => {
      const use = uses.includes(regItem.path);
      if ((use && !regItem.use) || (!use && regItem.use)) this.updateNeeded = true;
      regItem.use = use;
    });
  }

  hooked(compilation) {
    NormalModule.getCompilationHooks(compilation).loader
      .tap(NAMESPACE, (loaderContext) => this.methodsConvey(loaderContext));

    compilation.hooks.finishModules
      .tapAsync(NAMESPACE, (modules, complete) => {
        this.registerUpdate(compilation);
        this.updateMetaModule(compilation, complete);
      });
  }

  apply(compiler) {
    this.virtualModules = new VirtualModulesPlugin({
      [`node_modules/${this.metaModulePath}`]: this.genMetaModule(),
      [`node_modules/${this.artifactModulePath}`]: Buffer.alloc(0),
    });
    this.virtualModules.apply(compiler);

    compiler.hooks.thisCompilation.tap(NAMESPACE, (compilation) => { this.hooked(compilation); });
  }
}

module.exports = AccumulatorWebpackPlugin;
