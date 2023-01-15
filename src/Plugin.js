const { Buffer } = require('buffer');
const NormalModule = require('webpack/lib/NormalModule');
const { RawSource } = require('webpack-sources');
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
    const updateModule = this.register.find((item) => item.path === path);
    if (updateModule) updateModule.hash = hash;
    else {
      this.register.push({
        path,
        hash,
        use: true,
      });
    }

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
    return genCodeMetaModule(this.index, this.artifactModulePath, process.hrtime.bigint());
  }

  findMetaModule({ modules }) {
    return Array.from(modules)
      .find((module) => !!this.metaModulePath.match(module.rawRequest));
  }

  findArtifactModule({ modules }) {
    return Array.from(modules)
      .find((module) => !!this.artifactModulePath.match(module.rawRequest));
  }

  updateMetaModule(compilation, complete) {
    const metaModule = this.findMetaModule(compilation);

    this.accumulate(this.getUsesModule())
      .then(({ index, buffer }) => {
        this.index = index;

        const artifactModule = this.findArtifactModule(compilation);
        // TODO dirty hack for first update
        this.virtualModules.writeModule(`node_modules/${this.artifactModulePath}`, Buffer.from(process.hrtime.bigint().toString(), 'utf-8'));
        artifactModule._source = new RawSource(buffer);

        const codegen = this.genMetaModule();
        this.virtualModules.writeModule(`node_modules/${this.metaModulePath}`, codegen);
        metaModule._source._value = codegen; // eslint-disable-line no-underscore-dangle
        metaModule._source._valueAsBuffer = undefined; // eslint-disable-line no-underscore-dangle
        metaModule._source._valueAsString = undefined; // eslint-disable-line no-underscore-dangle

        complete();
      });
  }

  registerUpdate({ modules }) {
    const uses = Array.from(modules)
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
        if (this.findMetaModule(compilation)) this.updateMetaModule(compilation, complete);
        else complete();
      });
  }

  apply(compiler) {
    this.virtualModules = new VirtualModulesPlugin({
      [`node_modules/${this.artifactModulePath}`]: Buffer.alloc(0),
      [`node_modules/${this.metaModulePath}`]: this.genMetaModule(),
    });
    this.virtualModules.apply(compiler);

    compiler.hooks.thisCompilation.tap(NAMESPACE, (compilation) => { this.hooked(compilation); });
  }
}

module.exports = AccumulatorWebpackPlugin;
