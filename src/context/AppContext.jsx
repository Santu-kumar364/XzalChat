import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db, goOnline, updateUserStatus } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState(null);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [messageId, setMessageId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [chatDisplay, setChatDisplay] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);

  const [rightSidebarVisible, setRightSidebarVisible] = useState(false);

  const toggleRightSidebar = () => {
    setRightSidebarVisible((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setChatDisplay(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadUserData = async (uid) => {
    if (!uid) {
      console.log("No UID provided");
      navigate("/");
      return;
    }

    setLoading(true);
    console.log("Loading user data for:", uid);

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("User document not found - creating new user...");

        // Get current auth user for basic info
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No auth user found");
          navigate("/");
          return;
        }

        // Create new user document
        const newUserData = {
          name: currentUser.displayName || "",
          email: currentUser.email,
          username: currentUser.email.split("@")[0],
          avatar: currentUser.photoURL || "",
          bio: "",
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        await setDoc(userRef, newUserData);
        console.log("✅ New user document created:", newUserData);

        // Also create chats document
        const chatsRef = doc(db, "chats", uid);
        await setDoc(chatsRef, {
          chatData: [],
          createdAt: serverTimestamp(),
        });
        console.log("✅ New chats document created");

        setUserData({ id: uid, ...newUserData });

        console.log("Navigating to profile for completion");
        navigate("/profile");
        return;
      }

      const userData = userSnap.data();
      console.log("✅ User data loaded:", userData);
      setUserData({ id: uid, ...userData });

      // Update user status
      try {
        await updateUserStatus(uid, true);
      } catch (statusError) {
        console.warn("Could not update user status:", statusError);
      }

      // Navigate based on profile completion
      if (userData.avatar && userData.name) {
        console.log("Profile complete, navigating to chat");
        navigate("/chat");
      } else {
        console.log("Profile incomplete, navigating to profile setup");
        navigate("/profile");
      }
    } catch (error) {
      console.error("Error loading user data:", error);

      if (error.code === "permission-denied") {
        console.error("Permission denied - check Firestore rules");
        toast.error("Database permission error. Please refresh.");
      } else {
        console.log("Other error, navigating to home");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener...");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);

      if (user) {
        console.log("User authenticated:", user.uid);
        loadUserData(user.uid);
      } else {
        console.log("No user authenticated");
        setUserData(null);
        setLoading(false);
        navigate("/");
      }
    });

    return () => {
      console.log("Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  const value = {
    userData,
    setUserData,
    chatData,
    setChatData,
    loadUserData,
    messages,
    setMessages,
    messageId,
    setMessageId,
    chatUser,
    setChatUser,
    chatDisplay,
    setChatDisplay,
    isMobile,
    rightSidebarVisible,
    setRightSidebarVisible,
    toggleRightSidebar,
    loading,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
