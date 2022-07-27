const path = require("path");
const openFmFile = require("./openFmFile");
const performFmUrlScript = require("./performFmUrlScript");
const packageInfo = require("../../package.json");

module.exports = () => {
  openFmFile().then(() => {
    const script = "FMBond Create Web Project";
    const url = `file://${path.join(__dirname, "..", "..", "dist", "index.html")}`;
    const scriptParameter = {webProject: packageInfo.name, url};
    performFmUrlScript(script, scriptParameter);
  })
}