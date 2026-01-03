//Defining Elements

const getStartedButton = document.querySelector("#getStartedBtn");
const buyMeACoffeeButton = document.querySelector("#buymeacoffe");

runEventListeners()

function runEventListeners(){
    getStartedButton.addEventListener("click", getStarted);
    buyMeACoffeeButton.addEventListener("click", buyMeACoffee);
}

function getStarted(){
    window.location.href = "../app/index.html";
}
function buyMeACoffee(){
    window.location.href = "https://buymeacoffee.com/hasanhuseyinsenay";
}