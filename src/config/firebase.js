import { initializeApp } from "firebase/app";
import { 
  createUserWithEmailAndPassword, 
  getAuth, 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  setDoc, 
  doc, 
  collection,
  where, 
  query, 
  getDocs, 
  enableIndexedDbPersistence,
  enableNetwork,
  disableNetwork
} from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyB5Wer4_NvC-GUjXEPTGpKVnVCshKUn4BQ",
  authDomain: "xzalchat-f7ed7.firebaseapp.com",
  projectId: "xzalchat-f7ed7",
  storageBucket: "xzalchat-f7ed7.firebasestorage.app",
  messagingSenderId: "281347284211",
  appId: "1:281347284211:web:f16ae2acd64a4aaeef2b86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
const enablePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log("Firebase offline persistence enabled");
  } catch (err) {
    console.error("Firebase persistence error:", err);
    if (err.code === 'failed-precondition') {
      console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.log("The current browser doesn't support persistence");
    }
  }
};

enablePersistence();

// Network control functions
const goOnline = () => enableNetwork(db);
const goOffline = () => disableNetwork(db);

const signup = async (username, email, password) => {
  try {
    console.log("Starting signup process...");
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    console.log("User created:", user.uid);
    
    // Wait a moment for auth to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create user document
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name: "",
      avatar: "",
      bio: "Hey, I am using Xzalchat",
      lastSeen: new Date(),
      isOnline: true,
      createdAt: new Date(),
    });

    console.log("User document created");

    // Create chats document for the user
    await setDoc(doc(db, "chats", user.uid), {
      chatData: [],
      createdAt: new Date(),
    });

    console.log("Chats document created");
    
    toast.success("User registered successfully!");
    return user;
  } catch (error) {
    console.error("Error signing up:", error);
    let errorMessage = "An error occurred during signup";
    
    if (error.code === 'permission-denied') {
      errorMessage = "Database permission denied. Please check Firestore rules.";
    } else if (error.code) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage);
    throw error;
  }
};

const login = async (email, password) => {
  try {
    console.log("Attempting login for:", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Login successful:", user.uid);
    
    // Wait a moment for auth to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update user online status
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      isOnline: true,
      lastSeen: new Date(),
    }, { merge: true });
    
    console.log("User status updated");
    toast.success("Login successful!");
    return userCredential;
  } catch (error) {
    console.error("Error logging in:", error);
    let errorMessage = "An error occurred during login";
    
    if (error.code) {
      errorMessage = error.message;
      
      // Common error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later";
      } else if (error.code === 'permission-denied') {
        errorMessage = "Database permission denied. Please check Firestore rules.";
      }
    }
    
    toast.error(errorMessage);
    throw error;
  }
};
const logout = async () => {
  try {
    // Update user offline status before signing out
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      try {
        await setDoc(userRef, {
          isOnline: false,
          lastSeen: new Date(),
        }, { merge: true });
        console.log("User status updated to offline");
      } catch (statusError) {
        console.warn("Could not update user status, but continuing with logout:", statusError);
        // Continue with logout even if status update fails
      }
    }
    
    await signOut(auth);
    console.log("User signed out successfully");
    toast.success("Logged out successfully!");
  } catch (error) {
    console.error("Error logging out:", error);
    
    // Try to sign out anyway even if updating status fails
    try {
      await signOut(auth);
      console.log("User signed out after error");
      toast.success("Logged out successfully!");
    } catch (signOutError) {
      console.error("Error during sign out:", signOutError);
      toast.error("Failed to logout: " + (signOutError.message || "Unknown error"));
    }
  }
};

const resetPass = async (email) => {
  if (!email) {
    toast.error("Enter your email");
    return null;
  }
  
  try {
    const userRef = collection(db, 'users');
    const q = query(userRef, where("email", "==", email.toLowerCase()));
    const querySnap = await getDocs(q);
    
    if (!querySnap.empty) {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } else {
      toast.error("Email doesn't exist");
    }
  } catch (error) {
    console.error("Error in resetPass:", error);
    toast.error(error.message);
  }
};

// Utility function for updating user status
const updateUserStatus = async (userId, isOnline) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      isOnline: isOnline,
      lastSeen: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

export { 
  signup, 
  auth, 
  db, 
  app, 
  login, 
  logout, 
  resetPass, 
  goOnline, 
  goOffline, 
  updateUserStatus 
};