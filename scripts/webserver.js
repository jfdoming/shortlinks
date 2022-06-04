const webpack = require("webpack"),
  config = require("./webpack.config"),
  runHotReloader = require("./hot-reloader"),
  constants = require("../compat/constants-hr");

delete config.chromeExtensionBoilerplate;

config.watch = true;
webpack(config, function (err) {
  if (err) throw err;
});

runHotReloader(constants);
