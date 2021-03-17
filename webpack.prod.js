const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");

module.exports = merge(common, {
  mode: "production",
  target: ["web", "es5"],
  plugins: [new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/app.bundle/])],
});
