const OFF = 'off';
const ERROR = 'error';
const PRODUCTION = 'production';

module.exports = {
  root: true,
  env: {
    node: true,
  },
  plugins: ['import'],
  extends: [
    'airbnb-base',
    'plugin:sonarjs/recommended',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === PRODUCTION ? ERROR : OFF,
    'no-debugger': process.env.NODE_ENV === PRODUCTION ? ERROR : OFF,
    'import/no-extraneous-dependencies': OFF,
    'no-param-reassign': [ERROR, {
      props: true,
      ignorePropertyModificationsFor: [
        'loaderContext',
      ],
    }],
    'no-underscore-dangle': [ERROR, {
      allow: [
        '_source',
        '_replacements',
      ],
    }],
  },
};
