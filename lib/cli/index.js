const {execSync} = require("child_process");
const path = require("path");
const fs = require("fs");

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
      new Command (`git clone --depth 1 https://github.com/beezwax/fmbond-web-template ${repoPath}`),
      new Command (`cd ${repoPath} && npm install`),
      new Command (`cd ${repoPath} && npm run install_fm_suite ./src/filemaker/${repoName}.fmp12`),
      new Command (`cd ${repoPath} && rm -rf .git .gitignore bin lib`),
      new Command (String.raw`cd ${repoPath} && git init && echo "node_modules\n.DS_Store\n!dist\ndist/*\n!dist/index.html" > .gitignore`),
      new FunctionCommand (() => {
        const packageJson = path.join(repoPath, 'package.json');
        const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        json.name = repoName;
        json.version = "0.1.0";
        json.private = true;
        delete json.bin;
        delete json.repositories;
        console.log(json);
        fs.writeFileSync(packageJson, JSON.stringify(json, null, 2), 'utf8');
      }),
      new Command (`cd ${repoPath} && git add -A && git commit -m "Initial commit"`)
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

class FunctionCommand extends Command {
  run() {
    try {
      this.command()
    } catch (e) {
      return e;
    }
    return null;
  }
}