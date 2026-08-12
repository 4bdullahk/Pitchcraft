// src/components/ConfirmDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      slotProps={{ paper: { className: styles.paper } }}
    >
      <DialogTitle className={styles.title}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText className={styles.message}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button onClick={onCancel} className={styles.cancelButton}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          className={danger ? styles.dangerButton : styles.confirmButton}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}