import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, setDoc, doc, where, query, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
 
const firebaseConfig = {
  apiKey: "AIzaSyDDDYDixZ9hyI71p3_1XNUY9-hVw-saPFY",
  authDomain: "xzalchat-d515b.firebaseapp.com",
  projectId: "xzalchat-d515b",
  storageBucket: "xzalchat-d515b.firebasestorage.app",
  messagingSenderId: "731213793282",
  appId: "1:731213793282:web:eb4aa01d7a532fdf047f1b"
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


const resetPass = async(email) => {
  if(!email) {
    toast.error("Enter your email")
    return null;
  }
  try {
    const userRef = collection(db, 'user');
    const q = query(userRef,where("email", "==", email))
    const querySnap = await getDocs(q);
    if(!querySnap.empty) {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset Email Sent")
    } else{
      toast.error("Email doesn't exists")
    }


  }
  catch {

    console.error(error);
    toast.error(error.message)
  }
}



export { signup, auth, db, app,login, logout, resetPass };



