import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5gYaeNOYyE44XGo6iTtTSx7Y27GmpWnY",
  authDomain: "typearena-e6de0.firebaseapp.com",
  projectId: "typearena-e6de0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);