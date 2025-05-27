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

  useEffect(() => {
    return () => {
      if (userData) {
        const chatRef = doc(db, "chats", userData.id);
        const unSub = onSnapshot(chatRef, async (res) => {
          const chatItems = res.data().chatData;

          const tempData = [];
          for (const item of chatItems) {
            const userRef = doc(db, "users", item.userId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            tempData.push({ ...item, userData });
          }
          setChatData(tempData.sort((a, b) => b.createdAt - a.createdAt));
        });
        return () => {
          unSub();
        };
      }
    };
  }, [userData]);

  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      console.log(userSnap);

      const userData = userSnap.data();

      setUserData(userData);

      // Initial update of last seen
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
      });

      // Navigate based on profile completion
      if (userData.avatar && userData.name) {
        navigate("/chat");
      } else {
        navigate("/profile");
      }
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
      });

      setInterval(async () => {
        if (auth.chatUser) {
          await updateDoc(userRef, {
            lastSeen: serverTimestamp(),
          });
        }
      }, 60000);
    } catch (error) {
      console.error("Error loading user data:", error);
      navigate("/"); // Redirect to home on error
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
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;



 