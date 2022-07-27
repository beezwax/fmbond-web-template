const fetch = require("node-fetch");
const performFmUrlScript = require("./performFmUrlScript");

module.exports = (repoName) => {

  const startingPort = 8080;
  let port = 0;

  const deploy = async () => {
    for (let i = 0; i < 10000; i++) {
      const portFound = await checkForPort(startingPort + i);
      if(portFound) {
        port = startingPort + i;
        break;
      }
    }

    if(port) {
      const script = "FMBond Open Default Web Viewer In Debug Mode";
      const debugUrl = `http://localhost:${port}`;
      const scriptParameter = {webProject: repoName, debugUrl};
      performFmUrlScript(script, scriptParameter);
    }
  }

  const checkForPort = async (port) => {
    try {
      const httpResponse = await fetch(`http://localhost:${port}`);
      const packageName = await httpResponse.headers.get("packageName");
      const packageFound = packageName === repoName;
      return packageFound;
    } catch (error) {
      return false;
    }
  }

  deploy();
}