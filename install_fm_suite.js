const fs = require('fs');

const installSuite = (sourcePath, destPath, overwrite) => {
  // check file exists
  if (!overwrite) {
    if(fs.existsSync(destPath)) {
      throw new Error("File exists and overwrite flag is no set");
    }
  }
  fs.copyFileSync(sourcePath, destPath);
}

// get command line args
const args = process.argv.slice(2);

// first arg is destination path
const destPath = args[0] ? args[0] : "./src/filemaker/fmbond-filemaker-suite.fmp12";
console.log(destPath);

// second arg is overwrite flag
const overwrite = !!args[1];

// source path is
const sourcePath = "./node_modules/@beezwax/fmbond-filemaker-suite/fmbond-filemaker-suite.fmp12"

try {
  installSuite(sourcePath, destPath, overwrite);
  console.log("fmbond-filemaker-suite successfully installed!");
} catch (error) {
  console.log(error);
  throw error;
}