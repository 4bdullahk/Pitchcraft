// src/utils/user.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function getUserInfo(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data();
    } else {
      console.warn("User not found in Firestore.");
      return null;
    }
  } catch (err) {
    console.error("Error fetching user info:", err);
    return null;
  }
}
