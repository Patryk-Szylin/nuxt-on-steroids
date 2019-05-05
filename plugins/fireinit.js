import * as firebase from "firebase/app";

import "firebase/auth";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVJu1mz1_TQ2bcvI7Af7Lf868a3riHlTg",
  authDomain: "nuxt-project-e2a61.firebaseapp.com",
  databaseURL: "https://nuxt-project-e2a61.firebaseio.com",
  projectId: "nuxt-project-e2a61",
  storageBucket: "nuxt-project-e2a61.appspot.com",
  messagingSenderId: "538387939239",
  appId: "1:538387939239:web:f2abe264a5507099"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const GoogleProvider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export const StoreDB = firebase.firestore();
export default firebase;
