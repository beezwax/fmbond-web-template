import "core-js/stable";
import "regenerator-runtime/runtime";
import FMBond from "./FMBond";
import "./scss/app.scss";

const para = document.createElement("p");
para.innerText = "FMBond refers to a " + typeof FMBond;
document.body.appendChild(para);
