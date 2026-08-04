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
      <Card className={styles.card}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          Create Your PitchCraft Account
        </Typography>

        <Typography variant="body2" textAlign="center" mb={2} color="gray">
          Start building your AI-powered startup pitch today
        </Typography>

        <AuthForm onSubmit={handleSignup} buttonText="Sign Up" loading={loading} isSignup />

        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} color="primary" />
          </Box>
        )}

        <Typography variant="body2" mt={2} textAlign="center" color="gray">
          Already have an account?{" "}
          <Link to="/" className={styles.link}>
            Login
          </Link>
        </Typography>
      </Card>
    </div>
  );
}
