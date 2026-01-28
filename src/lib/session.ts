import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { toast } from "sonner";

const SESSION_KEY = "correctnow:sessionId";

const createSessionId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const getSessionId = () => {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = createSessionId();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
};

export const rotateSessionId = () => {
  const id = createSessionId();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
};

export const clearSessionId = () => {
  window.localStorage.removeItem(SESSION_KEY);
};

export const writeSessionId = async (user: User, forceNew = false) => {
  const db = getFirebaseDb();
  if (!db) return;
  const sessionId = forceNew ? rotateSessionId() : getSessionId();
  const ref = doc(db, "users", user.uid);
  await setDoc(
    ref,
    {
      sessionId,
      sessionUpdatedAt: new Date().toISOString(),
      status: "active",
    },
    { merge: true }
  );
  return sessionId;
};

export const startSessionEnforcement = () => {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  if (!auth || !db) return () => {};

  let unsubscribeDoc: (() => void) | undefined;

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeDoc) {
      unsubscribeDoc();
      unsubscribeDoc = undefined;
    }

    if (!user) {
      clearSessionId();
      return;
    }

    const ref = doc(db, "users", user.uid);
    unsubscribeDoc = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as { sessionId?: string; status?: string };
      const localSessionId = getSessionId();

      if (data.status === "deactivated") {
        await signOut(auth);
        toast.error("Your account is deactivated. Contact support to reactivate.");
        return;
      }

      if (data.sessionId && data.sessionId !== localSessionId) {
        await signOut(auth);
        toast.error("You were signed out because your account was used on another device.");
        return;
      }

      if (!data.sessionId) {
        await setDoc(
          ref,
          {
            sessionId: localSessionId,
            sessionUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    });
  });

  return () => {
    if (unsubscribeDoc) unsubscribeDoc();
    unsubscribeAuth();
  };
};
