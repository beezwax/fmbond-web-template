const path = require("path");
const performFmUrlScript = require("./performFmUrlScript");

module.exports = (repoName) => {
  const script = "FMBond Upsert Web Project";
  const url = `file://${path.join(__dirname, "..", "..", repoName, "dist", "index.html")}`;
  const scriptParameter = {webProject: repoName, url};
  performFmUrlScript(script, scriptParameter, repoName);
}