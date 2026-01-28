import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs as getFirestoreDocs,
  updateDoc,
  doc as firestoreDoc,
} from "firebase/firestore";

export interface SuggestionItem {
  id: string;
  message: string;
  email?: string;
  userId?: string;
  status: "new" | "reviewed" | "resolved";
  createdAt: string;
}

const STORAGE_KEY = "correctnow:suggestions";

const readLocal = (): SuggestionItem[] => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocal = (items: SuggestionItem[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("correctnow:suggestions-updated"));
};

export const getSuggestions = (): SuggestionItem[] => {
  return readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const addSuggestion = async (input: {
  message: string;
  email?: string;
  userId?: string;
}) => {
  const message = input.message.trim();
  if (!message) return null;

  const base: SuggestionItem = {
    id: `sug-${Date.now()}`,
    message,
    email: input.email,
    userId: input.userId,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  const next = [base, ...readLocal()];
  writeLocal(next);

  if (isFirebaseConfigured()) {
    const db = getFirebaseDb();
    if (db) {
      try {
        const ref = await addDoc(collection(db, "suggestions"), {
          message: base.message,
          email: base.email || "",
          userId: base.userId || "",
          status: base.status,
          createdAt: base.createdAt,
        });
        const updated = next.map((item) =>
          item.id === base.id ? { ...item, id: ref.id } : item
        );
        writeLocal(updated);
      } catch {
        // ignore remote failures
      }
    }
  }

  return base;
};

export const fetchRemoteSuggestions = async (): Promise<SuggestionItem[]> => {
  if (!isFirebaseConfigured()) return [];
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    const snap = await getFirestoreDocs(collection(db, "suggestions"));
    return snap.docs
      .map((docSnap) => ({
        ...(docSnap.data() as Omit<SuggestionItem, "id">),
        id: docSnap.id,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
};

export const mergeSuggestions = (local: SuggestionItem[], remote: SuggestionItem[]) => {
  const map = new Map<string, SuggestionItem>();
  local.forEach((item) => map.set(item.id, item));
  remote.forEach((item) => map.set(item.id, item));
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const updateSuggestionStatus = async (id: string, status: SuggestionItem["status"]) => {
  const items = readLocal().map((item) =>
    item.id === id ? { ...item, status } : item
  );
  writeLocal(items);

  if (isFirebaseConfigured()) {
    const db = getFirebaseDb();
    if (db) {
      try {
        await updateDoc(firestoreDoc(db, "suggestions", id), { status });
      } catch {
        // ignore remote failures
      }
    }
  }
};
