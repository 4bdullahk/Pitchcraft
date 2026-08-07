// src/components/ThemeToggle.jsx
import React from "react";
import { Tooltip } from "@mui/material";
import { useThemeMode } from "../context/ThemeModeContext";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Tooltip title={isLight ? "Switch to dark mode" : "Switch to light mode"}>
      <button
        type="button"
        onClick={toggleMode}
        className={styles.coinButton}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
        aria-pressed={isLight}
      >
        <span className={`${styles.coinInner} ${isLight ? styles.flipped : ""}`}>
          {/* Front face: moon — shown while in dark mode */}
          <span className={`${styles.coinFace} ${styles.coinFront}`}>
            <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
              <path
                d="M31 6c-9.4 0-17 7.6-17 17s7.6 17 17 17c4.2 0 8-1.5 11-4-2 .7-4.1 1-6.3 1-9.4 0-17-7.6-17-17 0-6.7 3.9-12.6 9.6-15.4-1.1-.4-2.2-.6-3.3-.6z"
                fill="currentColor"
              />
              <circle cx="34" cy="14" r="1.4" fill="currentColor" opacity="0.7" />
              <circle cx="38" cy="20" r="0.9" fill="currentColor" opacity="0.5" />
            </svg>
          </span>

          {/* Back face: sun — shown while in light mode */}
          <span className={`${styles.coinFace} ${styles.coinBack}`}>
            <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
              <circle cx="24" cy="24" r="9" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="24" y1="4" x2="24" y2="9" />
                <line x1="24" y1="39" x2="24" y2="44" />
                <line x1="4" y1="24" x2="9" y2="24" />
                <line x1="39" y1="24" x2="44" y2="24" />
                <line x1="9.5" y1="9.5" x2="13" y2="13" />
                <line x1="35" y1="35" x2="38.5" y2="38.5" />
                <line x1="38.5" y1="9.5" x2="35" y2="13" />
                <line x1="13" y1="35" x2="9.5" y2="38.5" />
              </g>
            </svg>
          </span>
        </span>
      </button>
    </Tooltip>
  );
}