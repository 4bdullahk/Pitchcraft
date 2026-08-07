// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Typography, Card, CircularProgress } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { friendlyAuthError } from "../utils/authErrors";
import AuthForm from "../components/AuthForm";
import ThemeToggle from "../components/ThemeToggle";
import styles from "./Login.module.css";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { firebaseUser, loading: authLoading } = useAuth();
  const showToast = useToast();

  // If already logged in, skip straight to the dashboard.
  useEffect(() => {
    if (!authLoading && firebaseUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, firebaseUser, navigate]);

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      showToast(friendlyAuthError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowA} aria-hidden="true" />
      <div className={styles.glowB} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.topBar}>
        <ThemeToggle />
      </div>

      <div className={styles.stage}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            AI Pitch Studio
          </p>
          <h1 className={styles.headline}>
            Welcome back.
            <svg
              className={styles.underline}
              viewBox="0 0 220 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M2 8 C 60 2, 160 2, 218 7" pathLength="1" />
            </svg>
          </h1>
          <Typography className={styles.subhead}>
            Sign in to keep crafting your pitch.
          </Typography>
        </div>

        <Card className={styles.card} elevation={0}>
          <AuthForm onSubmit={handleLogin} buttonText="Login" loading={loading} />

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={22} className={styles.spinner} />
            </Box>
          )}

          <Typography className={styles.footerText}>
            Don't have an account?{" "}
            <Link to="/signup" className={styles.link}>
              Sign Up
            </Link>
          </Typography>
        </Card>
      </div>
    </div>
  );
}