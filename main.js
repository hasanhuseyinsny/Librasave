import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { firebaseConfig } from './config.js'; // 👈 BU SATIRI EKLE

const loginButton = document.querySelector("#login");
const userNameEl = document.querySelector("#userName");
const userEmailEl = document.querySelector("#userEmail");
const userProfilePictureEl = document.querySelector("#pp");


/*const firebaseConfig = {
    apiKey: "AIzaSyDJNv0oR8idDU5ivkeetoaN6HevE9K_rIw",
    authDomain: "librasave-e16e4.firebaseapp.com",
    projectId: "librasave-e16e4",
    storageBucket: "librasave-e16e4.firebasestorage.app",
    messagingSenderId: "500379972592",
    appId: "1:500379972592:web:3cb61d897a975c21392335",
    measurementId: "G-VKFVV3MS51"
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};*/

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 
auth.languageCode = 'en';
const provider = new GoogleAuthProvider
const analytics = getAnalytics(app);

const user = auth.currentUser;

window.currentUser = null;

runEventListeners();
function runEventListeners(){
    loginButton.addEventListener("click", handleAuthButton)
}
function handleAuthButton(){
    if(currentUser){
        logout();
    } else {
        login();
    }
}
function login(){
    signInWithPopup(auth, provider)
    .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const user = result.user;
        console.log(user);
        
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
    });
}
function logout(){
    signOut(auth)
    .then(() => {
        console.log("Logout successful");
        //alert("Successfully logged out!");
    }).catch((error) => {
        console.error("Logout error:", error.message);
        //alert("Logout failed: " + error.message);
    });
}


function updateUserProfile(user){
    const userName = user.displayName;
    const userEmail = user.email;
    const userProfilePicture = user.photoURL;

    userNameEl.textContent = userName;
    userEmailEl.textContent = userEmail;
    userProfilePictureEl.src = userProfilePicture;
    //loginButton.textContent = window.t ? window.t('logout') : "Log Out";
    updateLoginButtonText(true);
}
function updateLoginButtonText(isLoggedIn){
    if(window.t && typeof window.t === 'function'){
        loginButton.textContent = isLoggedIn ? window.t('logout') : window.t('login');
    } else {
        loginButton.textContent = isLoggedIn ? "Log Out" : "Login with Google";
    }
}
function clearUserProfile(){
    userNameEl.textContent = "";
    userEmailEl.textContent = "";
    userProfilePictureEl.src = "";
    //loginButton.textContent = window.t ? window.t('login') : "Login with Google";
    updateLoginButtonText(false);
}
onAuthStateChanged(auth, (user) =>{
    if(user){
        window.currentUser = user;
        updateUserProfile(user);
        const uid = user.uid;

        setTimeout(() => {
            if(window.loadUserDataFromFirestore){
                window.loadUserDataFromFirestore(user.uid);
            } else {
                console.error("loadUserDataFromFirestore function not found!");
            }
        }, 100);
    }else{
        window.currentUser = null;
        clearUserProfile();
        console.log("No user logged in");

        // Kullanıcı çıkış yaptığında localStorage'ı temizle
        localStorage.clear();
        
        setTimeout(() => {
            if(typeof window.refreshUI === 'function'){
                window.refreshUI();
            }
            // Lent books listesini de temizle
            const lendList = document.querySelector("#lendList");
            if(lendList){
                lendList.innerHTML = '';
            }
        }, 100);
    }
});

window.auth = auth;
window.db = db;
window.currentUser = currentUser;
window.updateLoginButtonText = updateLoginButtonText;
