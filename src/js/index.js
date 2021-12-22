import FMBond from "@beezwax/fmbond";
import "../scss/app.scss";

const para = document.createElement("p");
para.innerText = "FMBond refers to a " + typeof FMBond;
document.body.appendChild(para);
