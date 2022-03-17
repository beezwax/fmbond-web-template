#!/usr/bin/env node

const {execSync} = require("child_process");

const runCommand = command => {
  try {
    execSync(`${command}`, {stdio: "inherit"})
  } catch (e) {
    console.error(`Failed to execute ${command}`, e);
    return false;
  }
  return true;
}

const repoName = process.argv[2];
const gitCheckoutCommand = `git clone --depth 1 https://github.com/beezwax/fmbond-web-template ${repoName}`;
const installDepsCommand = `cd ${repoName} && npm install`;
const installFmSuiteCommand = `npm run install_fm_suite ./src/filemaker/${repoName}.fmp12`;

console.log(`Creating new project with name ${repoName}`);
const checkedOut = runCommand(gitCheckoutCommand);
if(!checkedOut) {
  process.exit({code:-1});
}

console.log(`Installing dependencies for ${repoName}`);
const installedDeps = runCommand(installDepsCommand);
if(!installedDeps) {
  process.exit({code:-1});
}

console.log(`Creating FileMaker file at ./src/filemaker${repoName}.fmp12`);
const installedFmSuite = runCommand(installFmSuiteCommand);
if(!installedFmSuite) {
  process.exit({code:-1});
}

console.log(`Project created!`);