// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/Pitchcraft-logo.png";
import ReactMarkdown from "react-markdown";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";

import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  CircularProgress,
  Tooltip,
  Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LogoutIcon from "@mui/icons-material/Logout";
import AddCommentIcon from "@mui/icons-material/AddComment";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import apiClient, { postGenerateWithFile } from "../utils/apiClient";
import styles from "./Dashboard.module.css";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Hi — I'm PitchCraft. Tell me about your startup idea or ask for a pitch.",
  createdAt: Date.now(),
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Dashboard() {
  const { firebaseUser, profile } = useAuth();
  const uid = firebaseUser?.uid;
  const showToast = useToast();

  const [chatList, setChatList] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  // Optimistic UI for the message currently in flight. Kept separate from
  // `messages` (which is driven solely by the Firestore listener below) so the
  // two can never race and produce a visible duplicate — `messages` is always
  // the source of truth for anything persisted, this is only ever a preview.
  const [pendingUserText, setPendingUserText] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [file, setFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef();
  const scrollRef = useRef();
  // Guards against firing sendMessage twice for one Enter/click (e.g. a fast
  // double-press). `loading` state alone isn't enough here since a second
  // keypress can land before React re-renders with loading=true.
  const sendingRef = useRef(false);
  const navigate = useNavigate();

  // Live list of this user's chats.
  useEffect(() => {
    if (!uid) return;

    const userChatsRef = collection(db, "users", uid, "chats");
    const unsubscribe = onSnapshot(
      userChatsRef,
      (snapshot) => {
        const chats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChatList(chats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      },
      (err) => {
        console.error("Failed to load chats:", err);
        showToast("Couldn't load your chats. Check your connection.", "error");
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Live messages for the selected chat.
  useEffect(() => {
    if (!uid || !currentChatId) {
      setMessages([WELCOME_MESSAGE]);
      return;
    }

    const messagesRef = collection(db, "users", uid, "chats", currentChatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(
          msgs.length > 0
            ? msgs.map((m) => ({
                id: m.id,
                role: m.role,
                text: m.text,
                createdAt: m.timestamp || Date.now(),
              }))
            : [WELCOME_MESSAGE]
        );
      },
      (err) => {
        console.error("Failed to load messages:", err);
        showToast("Couldn't load this chat.", "error");
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, currentChatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingUserText, thinking]);

  const ensureChat = async (firstMessageText) => {
    if (currentChatId) return currentChatId;

    const userChatsRef = collection(db, "users", uid, "chats");
    const title =
      firstMessageText.length > 40 ? `${firstMessageText.slice(0, 40)}…` : firstMessageText;
    const newChat = await addDoc(userChatsRef, {
      title: title || `Chat ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
    });
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const sendMessage = async () => {
    if (!input.trim() || sendingRef.current) return;
    if (!uid) {
      showToast("You need to be signed in to chat.", "error");
      return;
    }

    sendingRef.current = true;
    setLoading(true);

    const messageText = input;
    const attachedFile = file;
    const displayText = attachedFile ? `${messageText}\n\n📎 ${attachedFile.name}` : messageText;

    setInput("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setPendingUserText(displayText);
    setThinking(true);

    try {
      const chatId = await ensureChat(messageText);

      let res;
      if (attachedFile) {
        const formData = new FormData();
        formData.append("message", messageText);
        formData.append("file", attachedFile);
        res = await postGenerateWithFile(formData);
      } else {
        res = await apiClient.post("/api/generate", { message: messageText });
      }

      const assistantText = res?.data?.reply || "Sorry, I couldn't generate a reply.";
      const chatRef = collection(db, "users", uid, "chats", chatId, "messages");

      await addDoc(chatRef, {
        role: "user",
        text: displayText,
        timestamp: new Date().toISOString(),
      });
      // The Firestore listener now has the confirmed user message, so drop
      // our local preview of it to avoid a brief double-render.
      setPendingUserText(null);

      await addDoc(chatRef, {
        role: "assistant",
        text: assistantText,
        timestamp: new Date().toISOString(),
      });
      setThinking(false);
      // The listener will pick up both writes above and become the sole
      // source of truth for `messages` — no manual setMessages needed here.
    } catch (err) {
      console.error("AI service error:", err);
      const errorText =
        err?.response?.data?.error ||
        "There was an error contacting the AI service. Please try again.";
      setPendingUserText(null);
      setThinking(false);
      showToast(errorText, "error");
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      showToast("File too large (max 10MB).", "warning");
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([WELCOME_MESSAGE]);
    setPendingUserText(null);
    setThinking(false);
    setSidebarOpen(false);
  };

  const deleteChat = async (chatId) => {
    if (!uid || !chatId) return;
    if (!window.confirm("Delete this chat permanently?")) return;

    try {
      const messagesRef = collection(db, "users", uid, "chats", chatId, "messages");
      const messagesSnap = await getDocs(messagesRef);
      await Promise.all(messagesSnap.docs.map((m) => deleteDoc(m.ref)));
      await deleteDoc(doc(db, "users", uid, "chats", chatId));

      setChatList((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([WELCOME_MESSAGE]);
        setPendingUserText(null);
        setThinking(false);
      }
      showToast("Chat deleted.", "success");
    } catch (err) {
      console.error("Error deleting chat:", err);
      showToast("Failed to delete chat. Try again.", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      showToast("Logout failed. Please try again.", "error");
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!", "success");
    } catch {
      showToast("Couldn't copy to clipboard.", "error");
    }
  };

  return (
    <Box className={styles.page}>
      <Paper className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`} elevation={2}>
        <Box p={2} display="flex" alignItems="center" gap={1}>
          <img src={logo} alt="PitchCraft Logo" style={{ width: 32, height: 32, borderRadius: 6 }} />
          <Box>
            <Typography variant="h6" sx={{ color: "#58a6ff", fontWeight: "bold" }}>
              PitchCraft
            </Typography>
            <Typography variant="body2" color="gray">
              AI Startup Partner
            </Typography>
          </Box>
        </Box>

        <Box px={2} pb={1}>
          <Box
            onClick={createNewChat}
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              cursor: "pointer",
              color: "#58a6ff",
              "&:hover": { color: "#7ec1ff" },
            }}
          >
            <AddCommentIcon fontSize="small" />
            <Typography variant="body2">New Chat</Typography>
          </Box>
        </Box>

        <Box className={styles.chatList} p={2}>
          {chatList.length === 0 && (
            <Typography variant="caption" color="gray">
              Your conversations will show up here.
            </Typography>
          )}
          {chatList.map((chat) => (
            <Box key={chat.id} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography
                variant="body2"
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setSidebarOpen(false);
                }}
                style={{
                  cursor: "pointer",
                  color: currentChatId === chat.id ? "#58a6ff" : "white",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {chat.title}
              </Typography>
              <Tooltip title="Delete chat">
                <IconButton size="small" onClick={() => deleteChat(chat.id)} style={{ color: "#ff6b6b" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>

        <Box className={styles.userInfo} p={2} display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" minWidth={0} flex={1}>
            <Avatar>{profile?.firstName?.[0] || "P"}</Avatar>
            <Box ml={2} minWidth={0}>
              <Typography
                variant="subtitle1"
                color="white"
                sx={{ fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {profile ? `${profile.firstName} ${profile.lastName}` : "Guest"}
              </Typography>
              <Typography
                variant="caption"
                color="white"
                sx={{ opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
              >
                {firebaseUser?.email || "Not signed in"}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} style={{ color: "#ff6b6b", flexShrink: 0 }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {sidebarOpen && <Box className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <Box className={styles.chatArea}>
        <Box className={styles.header} display="flex" alignItems="center" gap={1}>
          <IconButton className={styles.menuButton} onClick={() => setSidebarOpen((s) => !s)} size="small">
            <MenuIcon sx={{ color: "#fff" }} />
          </IconButton>
          <Box>
            <Typography variant="h6">AI Assistant</Typography>
            <Typography variant="caption" color="gray">
              Powered by Gemini 2.5
            </Typography>
          </Box>
        </Box>

        <Box className={styles.messages}>
          {messages.map((m) => (
            <Box key={m.id} className={m.role === "user" ? styles.msgUser : styles.msgAssistant}>
              <div className={styles.msgBubble}>
                <Box>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <Typography variant="body2">{children}</Typography>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      li: ({ children }) => <li style={{ marginLeft: "1rem" }}>{children}</li>,
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>

                  {m.role === "assistant" && (
                    <Box display="flex" justifyContent="flex-end" mt={0.5}>
                      <Tooltip title="Copy response">
                        <IconButton size="small" onClick={() => copyToClipboard(m.text)} style={{ color: "#58a6ff" }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </div>
            </Box>
          ))}

          {/* Optimistic preview of the message just sent, before Firestore confirms it. */}
          {pendingUserText && (
            <Box className={styles.msgUser}>
              <div className={styles.msgBubble}>
                <Typography variant="body2">{pendingUserText}</Typography>
              </div>
            </Box>
          )}

          {/* Typing indicator — deliberately plain markup (not ReactMarkdown/Typography)
              so the animated dots stay inline with the text on one line. */}
          {thinking && (
            <Box className={styles.msgAssistant}>
              <div className={styles.msgBubble}>
                <div className={styles.thinkingRow}>
                  <span>PitchCraft is thinking</span>
                  <span className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            </Box>
          )}

          <div ref={scrollRef} />
        </Box>

        {file && (
          <Box px={2} pb={1}>
            <Chip
              label={file.name}
              onDelete={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              deleteIcon={<CloseIcon />}
              sx={{ background: "rgba(88,166,255,0.12)", color: "#58a6ff" }}
            />
          </Box>
        )}

        <Box className={styles.composer}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={onFileChange}
            style={{ display: "none" }}
            id="file-input"
          />
          <label htmlFor="file-input">
            <Tooltip title="Attach image or PDF">
              <IconButton component="span" size="large">
                <AttachFileIcon style={{ color: "#58a6ff" }} />
              </IconButton>
            </Tooltip>
          </label>

          <TextField
            placeholder="Describe your idea or ask for a pitch..."
            variant="outlined"
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!loading) sendMessage();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={sendMessage} disabled={loading || !input.trim()}>
                    {loading ? <CircularProgress size={20} /> : <SendIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box p={1} className={styles.footerNote}>
          <Typography variant="caption" color="gray">
            You can attach images or PDFs (max 10MB).
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}