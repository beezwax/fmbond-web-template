#!/usr/bin/env node

const {exec, execSync} = require("child_process");
execSync("npm install");
const CLI = require('../lib/cli/index.js');
const cli = new CLI();
cli.start(process.argv.slice(2));