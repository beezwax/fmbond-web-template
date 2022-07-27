const open = require("open");
const packageInfo = require("../../package.json");

module.exports = (script, scriptParameter) => {
  const scriptUrlEncoded = encodeURIComponent(script);
  const scriptParameterStringified = typeof scriptParameter === "object" ? JSON.stringify(scriptParameter) : scriptParameter;
  const scriptParameterUrlEncoded = encodeURIComponent(scriptParameterStringified);
  const scriptUrl = `fmp://$/${packageInfo.name}.fmp12?script=${scriptUrlEncoded}&param=${scriptParameterUrlEncoded}`;
  open(scriptUrl);
}