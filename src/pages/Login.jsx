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
      <Card className={styles.card}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          Welcome Back to PitchCraft
        </Typography>

        <Typography variant="body2" textAlign="center" mb={2} color="gray">
          Sign in and continue creating your AI startup magic
        </Typography>

        <AuthForm onSubmit={handleLogin} buttonText="Login" loading={loading} />

        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} color="primary" />
          </Box>
        )}

        <Typography variant="body2" mt={2} textAlign="center" color="gray">
          Don't have an account?{" "}
          <Link to="/signup" className={styles.link}>
            Sign Up
          </Link>
        </Typography>
      </Card>
    </div>
  );
}
