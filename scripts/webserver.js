var WebpackDevServer = require("webpack-dev-server"),
  webpack = require("webpack"),
  config = require("../webpack.config"),
  env = require("./env"),
  path = require("path");

var options = config.chromeExtensionBoilerplate || {};
var excludeEntriesToHotReload = options.notHotReload || [];

var wsClientConfig = {
  webSocketURL: {
    protocol: "ws",
    hostname: env.HOSTNAME,
    port: env.PORT,
    pathname: "/ws",
  },
};
var wsConfigQuery =
  "webpack-dev-server/client?" +
  Object.entries(wsClientConfig.webSocketURL)
    .map(([k, v]) => k + "=" + v)
    .join("&");

for (var entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [wsConfigQuery, "webpack/hot/dev-server"].concat(
      config.entry[entryName]
    );
  }
}

config.plugins = [new webpack.HotModuleReplacementPlugin()].concat(
  config.plugins || []
);

delete config.chromeExtensionBoilerplate;

var compiler = webpack(config);

var server = new WebpackDevServer(
  {
    hot: true,
    static: {
      directory: path.join(__dirname, "../build"),
    },
    client: wsClientConfig,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    allowedHosts: "all",
    devMiddleware: {
      writeToDisk: true,
    },
  },
  compiler
);

server.start();
