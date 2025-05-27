import React, { useState } from "react";
import "./Login.css";
import assets from "../../assets/assets";
import { signup , login} from "../../config/firebase";
 

const Login = () => {
  const [currState, setCurrState] = useState("Sign Up");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currState === "Sign Up") {
      signup(username, email, password);
    } 
    else {
      login(email, password);
    }
  };

  const toggleState = () => {
    setCurrState((prev) => (prev === "Sign Up" ? "Login" : "Sign Up"));
  };

  return (
    <div className="login">
      <img src={assets.logo_big} alt="App Logo" className="logo" />
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
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          {currState === "Sign Up" ? "Create account" : "Login"}
        </button>

        <div className="login-term">
          <input type="checkbox" id="terms" name="agreeToTerms" />
          <label htmlFor="terms">
            Agree to the terms of use & privacy policy
          </label>
        </div>

        <div className="login-forget">
          <p className="login-toggle">
            {currState === "Sign Up"
              ? "Already have an account?"
              : "Don't have an account?"}
            <span onClick={toggleState}>
              {currState === "Sign Up" ? " Login here" : " Sign Up"}
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
