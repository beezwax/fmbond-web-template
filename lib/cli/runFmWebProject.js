const fetch = require("node-fetch");
const performFmUrlScript = require("./performFmUrlScript");

module.exports = (repoName) => {

  const startingPort = 8080;
  let port = 0;
  const timeout = 20000;
  let lastCheck = 0;

  const deploy = async () => {
    console.log("\x1b[33mWaiting for web server...\x1b[0m");
    const start = Date.now();
    while (Date.now() - start < timeout && !port) {
      if(Date.now() - lastCheck > 999) {
        lastCheck = Date.now();
        for (let i = 0; i < 10; i++) {
          const portFound = await checkForPort(startingPort + i);
          if(portFound) {
            port = startingPort + i;
            break;
          }
        }
      }
    }

    if(port) {
      console.log("\x1b[33mWeb server ready\x1b[0m");
      const script = "FMBond Open Default Web Viewer In Debug Mode";
      const debugUrl = `http://localhost:${port}`;
      const scriptParameter = {webProject: repoName, debugUrl};
      performFmUrlScript(script, scriptParameter, repoName);
      console.log("\x1b[32mWeb project opened in FileMaker!\x1b[0m");
    } else {
      throw new Error("\x1b[91mCould not find hosted web project\x1b[0m");
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