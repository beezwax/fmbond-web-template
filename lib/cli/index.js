const {exec, execSync} = require("child_process");
const path = require("path");
const fs = require("fs");
const createFmWebProject = require("./createFmWebProject");
const runFmWebProject = require("./runFmWebProject");

module.exports = class CLI {

  configurePackageJson () {
    const packageJson = path.join(repoPath, 'package.json');
    const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    json.name = repoName;
    json.version = "0.1.0";
    json.private = true;
    delete json.bin;
    delete json.repository;
    fs.writeFileSync(packageJson, JSON.stringify(json, null, 2), 'utf8');
  }

  start ([repoPath]) {

    const repoPathObject = path.parse(repoPath);

    const { name: repoName } = repoPathObject;

    // Ensure repoName not empty
    if (!repoName) {
      console.error("Missing repo name: Proper format is create-fmbond-app <repo-name>");
      return;
    }

    // Run commands
    const commands = [
      new Command (`git clone -b deploy_in_fm --single-branch --depth 1 https://github.com/beezwax/fmbond-web-template ${repoPath}`),
      new Command (`cd ${repoPath} && npm install`),
      new Command (`cd ${repoPath} && npm run install_fm_suite ./src/filemaker/${repoName}.fmp12`),
      new Command (`cd ${repoPath} && rm -rf .git .gitignore`),
      new Command (String.raw`cd ${repoPath} && git init && echo "node_modules\n.DS_Store\n!dist\ndist/*\n!dist/index.html" > .gitignore`),
      new FunctionCommand (() => {
        const packageJson = path.join(repoPath, 'package.json');
        const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        json.name = repoName;
        json.version = "0.1.0";
        json.private = true;
        delete json.bin;
        delete json.repository;
        fs.writeFileSync(packageJson, JSON.stringify(json, null, 2), 'utf8');
      }),
      new Command (`cd ${repoPath} && git add -A && git commit -m "Initial commit"`),
      new FunctionCommand (createFmWebProject, [repoPath]),
      new Command (`cd ${repoPath} && npm run start_silent`, undefined, true),
      new FunctionCommand (runFmWebProject, [repoName])
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
  constructor(command, args, noWait, waitMs) {
    this.command = command;
    this.execFunction = noWait ? exec : execSync;
    this.args = args ? args : [];
    this.waitMs = waitMs;
  }

  run () {
    try {
      this.execFunction(`${this.command}`, {stdio: "inherit"});
    } catch (e) {
      return e;
    }
    return null;
  }
}

class FunctionCommand extends Command {
  run() {
    try {
      if(this.waitMs) {
        setTimeout(() => this.command(...this.args), this.waitMs);
      } else {
        this.command(...this.args);
      };
    } catch (e) {
      return e;
    }
    return null;
  }
}