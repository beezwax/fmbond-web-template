const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  target: ["web", "es5"],
  entry: {
    entry: ["whatwg-fetch", "core-js/features/promise", "./src/index.js"],
  },
});
