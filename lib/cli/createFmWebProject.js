const path = require("path");
const openFmFile = require("./openFmFile");
const performFmUrlScript = require("./performFmUrlScript");

module.exports = (repoPath) => {

  const { name: repoName } = path.parse(repoPath);

  openFmFile(repoPath).then(() => {
    const script = "FMBond Create Web Project";
    const url = `file://${path.join(__dirname, "..", "..", repoName, "dist", "index.html")}`;
    const scriptParameter = {webProject: repoName, url};
    performFmUrlScript(script, scriptParameter, repoName);
  })
}