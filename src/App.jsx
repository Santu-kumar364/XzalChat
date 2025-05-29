import React, { use, useContext, useEffect, useState } from "react";
import Chat from "./webPages/Chat/Chat";
import ProfileUpdate from "./webPages/Profile/ProfileUpdate";
import Login from "./webPages/Login/Login";
import { Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { AppContext } from "./context/AppContext";

const App = () => {
  const navigate = useNavigate();
  const {loadUserData}  = useContext(AppContext);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        navigate("/chat");
         
        await loadUserData(user.uid);
      } else {
        navigate("/");
      }
    });
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<ProfileUpdate />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  );
};

export default App;

  


 