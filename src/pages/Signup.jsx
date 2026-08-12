// src/pages/Signup.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Typography, Card, CircularProgress } from "@mui/material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { friendlyAuthError } from "../utils/authErrors";
import AuthForm from "../components/AuthForm";
import ThemeToggle from "../components/ThemeToggle";
import styles from "./Signup.module.css";

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { firebaseUser, loading: authLoading } = useAuth();
  const showToast = useToast();

  useEffect(() => {
    if (!authLoading && firebaseUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, firebaseUser, navigate]);

  const handleSignup = async (email, password, firstName, lastName, confirmPassword) => {
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "warning");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          firstName,
          lastName,
          email,
          createdAt: new Date().toISOString(),
        });
      } catch (profileErr) {
        // The auth account was created but the Firestore profile write failed
        // (e.g. security rules, offline). Let the user know instead of
        // silently sending them to a dashboard with a missing profile.
        console.error("Failed to create user profile:", profileErr);
        showToast(
          "Account created, but we couldn't save your profile. You can still continue.",
          "warning"
        );
      }

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
            Start crafting.
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
            Create an account to turn ideas into pitches.
          </Typography>
        </div>

        <Card className={styles.card} elevation={0}>
          <AuthForm onSubmit={handleSignup} buttonText="Sign Up" loading={loading} isSignup />

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={22} className={styles.spinner} />
            </Box>
          )}

          <Typography className={styles.footerText}>
            Already have an account?{" "}
            <Link to="/" className={styles.link}>
              Login
            </Link>
          </Typography>
        </Card>
      </div>
    </div>
  );
}