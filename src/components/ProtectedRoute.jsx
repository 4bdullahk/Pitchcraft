// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ background: "#0d1117" }}
      >
        <CircularProgress sx={{ color: "#58a6ff" }} />
      </Box>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}
