const {execSync} = require("child_process");

module.exports = class CLI {

  start ([repoName]) {

    // Ensure repoName not empty
    if (!repoName) {
      console.error("Missing repo name: Proper format is create-fmbond-app <repo-name>");
      return;
    } 

    // Run commands
    const commands = [
      new Command (`git clone --depth 1 https://github.com/beezwax/fmbond-web-template ${repoName}`),
      new Command (`cd ${repoName} && npm install`),
      new Command (`cd ${repoName} && npm run install_fm_suite ./src/filemaker/${repoName}.fmp12`),
      new Command (`cd ${repoName} && rm -rf .git .gitignore`),
      new Command (String.raw`cd ${repoName} && git init && echo "node_modules\n.DS_Store\n!dist\ndist/*\n!dist/index.html" > .gitignore`),
      new Command (`cd ${repoName} && git add -A && git commit -m "Initial commit"`)
    ];
    for(const command of commands) {
      const error = command.run();
      if(error !== null) {
        console.error(`Failed to execute ${command.command}`, error);
        return;
      }
    }
    console.log(`Project created!`);
  }
}

class Command {
  constructor(command) {
    this.command = command;
  }

  run () {
    try {
      execSync(`${this.command}`, {stdio: "inherit"})
    } catch (e) {
      return e;
    }
    return null;
  }
}