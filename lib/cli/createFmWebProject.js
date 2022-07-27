const path = require("path");
const openFmFile = require("./openFmFile");
const performFmUrlScript = require("./performFmUrlScript");

module.exports = () => {
  openFmFile().then(() => {
    const script = "FMBond Create Web Project";
    const url = `file://${path.join(__dirname, "dist", "index.html")}`;
    const scriptParameter = {webProject: repoName, url};
    performFmUrlScript(script, scriptParameter);
  })
}