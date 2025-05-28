import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyCBmdD2PbinUYFR_cpBSl2VwpJ64zfVyxU",
  authDomain: "xzalchat-35d25.firebaseapp.com",
  projectId: "xzalchat-35d25",
  storageBucket: "xzalchat-35d25.firebasestorage.app",
  messagingSenderId: "259998782249",
  appId: "1:259998782249:web:98bb1bd1f41ea535049d38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (username, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name: "",
      avatar: "",
      bio: "Hey, I am using Xzalchat",
      lastSeen: new Date(),
    });

    await setDoc(doc(db, "chats", user.uid), {
      chatData: [],
    });
     toast.success("User registered successfully!");
  } catch (error) {
    console.error("Error signing up:", error);
    toast.error(error.code.split('/')[1].split('-').join(' '));
  }
};

const login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    toast.success("Login successful!");
  } catch (error) {
    console.error("Error logging in:", error);
    toast.error(error.code.split('/')[1].split('-').join(' '));
  }
};

const logout = async () => {
  try {
    await signOut(auth);
    toast.success("Logged out successfully!");
  } catch (error) {
    console.error("Error logging out:", error);
    toast.error(error.code.split('/')[1].split('-').join(' '));
  }
};



export { signup, auth, db, app,login, logout };



