import FMBond from "@beezwax/fmbond";
import "../scss/app.scss";

const main = document.createElement("main");

const heading = document.createElement("h1");
heading.innerHTML = "FMBond";

const subheading = document.createElement("h2");
subheading.innerText = typeof FMBond === "function" ? "is working for you" : "is having issues";

const logo = document.createElement("div");
logo.classList.add("logo");
logo.innerText = "∞";

const instruction = document.createElement("p");
instruction.innerText = "Edit and save ./src/js/index.js to update this page.";

const learn = document.createElement("p");
const learnLink = document.createElement("a");
learnLink.setAttribute("href", "https://github.com/beezwax/fmbond-js");
learnLink.setAttribute("target", "_blank");
learnLink.innerText = `Learn FMBond`;
learn.appendChild(learnLink);

main.appendChild(heading);
main.appendChild(subheading);
main.appendChild(logo);
if(window.location.hostname === "localhost") {
  main.appendChild(instruction);
}
main.appendChild(learn);
document.body.appendChild(main);