import React, { useContext, useEffect, useState } from "react";
import "./ProfileUpdate.css";
import assets from "../../assets/assets";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import upload from "../../liberaries/upload";
import { AppContext } from "../../context/AppContext";

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [prevImage, setPrevImage] = useState(null);
  const { setUserData } = useContext(AppContext);

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      if (!prevImage && !image) {
        toast.error("Please select an image");
        return;
      }

      const docRef = doc(db, "users", uid);

      if (image) {
        const imgUrl = await upload(image); // will call cloudinary with type 'image'
        setPrevImage(imgUrl);
        await updateDoc(docRef, {
          avatar: imgUrl,
          name: name,
          bio: bio,
        });
      } else {
        await updateDoc(docRef, {
          name: name,
          bio: bio,
        });
      }
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate("/chat");

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        const data = docSnap.data();
        if (data?.name) setName(data.name);
        if (data?.bio) setBio(data.bio);
        if (data?.avatar) setPrevImage(data.avatar);
      } else {
        navigate("/");
      }
    });
  }, []);

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate} className="profile-form">
          <h3>Profile Details</h3>
          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id="avatar"
              accept="image/*"
              hidden
            />
            <img
              src={image ? URL.createObjectURL(image) : assets.avatar_icon}
              alt="Preview"
            />
            Upload profile picture
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder="Your name"
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
          />
          <button type="submit">Save</button>
        </form>

        <img
          className="profile-pic"
          src={
            image ? URL.createObjectURL(image) :prevImage? prevImage : "/chat_logo.jpeg"
          }
          alt="Profile Preview"
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;
