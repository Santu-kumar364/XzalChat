import React, { useState } from "react";
import "./Login.css";
import assets from "../../assets/assets";
import { signup, login, resetPass } from "../../config/firebase";
import { toast } from "react-toastify";

const Login = () => {
  const [currState, setCurrState] = useState("Sign Up");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log("Form submitted:", { currState, username, email, password });

    try {
      if (currState === "Sign Up") {
        console.log("Attempting signup...");
        await signup(username, email, password);
        console.log("Signup completed successfully");
      } else {
        console.log("Attempting login...");
        await login(email, password);
        console.log("Login completed successfully");
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleState = () => {
    setCurrState((prev) => (prev === "Sign Up" ? "Login" : "Sign Up"));
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email first");
      return;
    }

    try {
      await resetPass(email.trim());
    } catch (error) {
      console.error("Reset password error:", error);
    }
  };

  return (
    <div className="login">
      <img src={assets.logo2} alt="App Logo" className="logo" />
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{currState}</h2>

        {currState === "Sign Up" && (
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength="6"
        />

        <button type="submit" disabled={loading}>
          {loading 
            ? "Processing..." 
            : currState === "Sign Up" 
              ? "Create account" 
              : "Login"
          }
        </button>

        <div className="login-term">
          <input type="checkbox" id="terms" name="agreeToTerms" required />
          <label htmlFor="terms">
            Agree to the terms of use & privacy policy
          </label>
        </div>

        <div className="login-forget">
          <p className="login-toggle">
            {currState === "Sign Up"
              ? "Already have an account?"
              : "Don't have an account?"}
            <span onClick={toggleState} style={{cursor: "pointer", color: "blue"}}>
              {currState === "Sign Up" ? " Login here" : " Sign Up"}
            </span>
          </p>
          {currState === "Login" && (
            <p className="login-toggle">
              Forgot Password?
              <span 
                onClick={handleResetPassword} 
                style={{cursor: "pointer", color: "blue"}}
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;