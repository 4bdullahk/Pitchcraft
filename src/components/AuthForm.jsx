// src/components/AuthForm.jsx
import React, { useState } from "react";
import { Box, TextField, Button, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useToast } from "../context/ToastContext";
import styles from "./AuthForm.module.css";

export default function AuthForm({ onSubmit, buttonText, loading, isSignup }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const showToast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    if (isSignup && password.length < 6) {
      showToast("Password should be at least 6 characters.", "warning");
      return;
    }

    if (isSignup) {
      onSubmit(email, password, firstName.trim(), lastName.trim(), confirmPassword);
    } else {
      onSubmit(email, password);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className={styles.form}>
      {isSignup && (
        <>
          <TextField
            label="First Name"
            variant="outlined"
            fullWidth
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={styles.input}
          />

          <TextField
            label="Last Name"
            variant="outlined"
            fullWidth
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={styles.input}
          />
        </>
      )}

      <TextField
        label="Email"
        type="email"
        variant="outlined"
        fullWidth
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
      />

      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        variant="outlined"
        fullWidth
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((s) => !s)}
                edge="end"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {isSignup && (
        <TextField
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.input}
        />
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        className={styles.button}
      >
        {buttonText}
      </Button>
    </Box>
  );
}
