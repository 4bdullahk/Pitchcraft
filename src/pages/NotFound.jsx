// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";

export default function NotFound() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
      sx={{ background: "#0d1117", color: "#fff", textAlign: "center", padding: 3 }}
    >
      <Typography variant="h2" fontWeight="bold" sx={{ color: "#58a6ff" }}>
        404
      </Typography>
      <Typography variant="body1" color="gray">
        This page doesn't exist.
      </Typography>
      <Button component={Link} to="/" variant="contained" sx={{ mt: 1 }}>
        Back to login
      </Button>
    </Box>
  );
}
