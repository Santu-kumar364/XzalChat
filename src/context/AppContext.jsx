import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { createContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState(null);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [messageId, setMessageId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [chatDisplay, setChatDisplay] = useState(false);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

 const toggleRightSidebar = () => {
  console.log("Toggling sidebar. Current state:", rightSidebarVisible);
  setRightSidebarVisible(prev => !prev);
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

  useEffect(() => {
    if (!userData?.id) return; // Ensure userData.id exists

    const chatRef = doc(db, "chats", userData.id);
    const unSub = onSnapshot(chatRef, async (res) => {
      if (!res.exists()) return;

      const chatItems = res.data().chatData || [];
      const tempData = [];

      for (const item of chatItems) {
        // Skip if userId is missing
        if (!item?.rId) {
          console.warn("Skipping item with missing userId:", item);
          continue;
        }

        try {
          const userRef = doc(db, "users", item.rId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            tempData.push({ ...item, userData });
          } else {
            console.warn("User not found:", item.rId);
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }

      setChatData(tempData.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => unSub();
  }, [userData?.id]); // Only re-run if userData.id changes

  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      setUserData(userData);
      await updateDoc(userRef, { lastSeen: serverTimestamp() });

      if (userData.avatar && userData.name) {
        navigate("/chat");
      } else {
        navigate("/profile");
      }

      const interval = setInterval(async () => {
        if (auth.currentUser) {
          await updateDoc(userRef, { lastSeen: serverTimestamp() });
        }
      }, 60000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Error loading user data:", error);
      navigate("/");
    }
  };

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
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
