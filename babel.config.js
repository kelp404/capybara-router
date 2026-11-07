module.exports = {
  // Babel 8 defaults to browserslist "defaults", keep Babel 7's default (all browsers).
  targets: '>= 0%',
  presets: [
    '@babel/preset-env',
    // Babel 8 defaults to the automatic runtime, keep the classic runtime (React.createElement).
    ['@babel/preset-react', {runtime: 'classic'}],
  ],
};
