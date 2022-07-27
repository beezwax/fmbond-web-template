const open = require("open");
const path = require("path");
const package = require("../..package.json");
const find = require("find-process");

module.exports = () => {
  const filePath = path.join(__dirname, "src", "filemaker", `${package.name}.fmp12`);
  open(filePath);
  return new Promise((resolve, reject) => {
    const timeout = 10000;
    const start = Date.now();
    const fileMakerOpen = setInterval(() => {
        find("name", /FileMaker Pro/).then((result) => {
          if(result.length) {
            clearInterval(fileMakerOpen);
            resolve(true);
          }
          if(Date.now() - start > timeout){
            clearInterval(fileMakerOpen);
            reject(new Error("Timeout reached"));
          }
        })
      },
      1000
    );
  })
}