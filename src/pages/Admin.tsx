import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle,
  Users,
  FileText,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
  Settings,
  LogOut,
  Search,
  Download,
  Filter,
  MessageSquare,
  CreditCard,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo,
  Redo,
  X,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import {
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { toast } from "sonner";
import {
  fetchRemoteSuggestions,
  getSuggestions,
  mergeSuggestions,
  updateSuggestionStatus,
  type SuggestionItem,
} from "@/lib/suggestions";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  wordLimit?: number;
  credits?: number;
  creditsUsed?: number;
  addonCredits?: number;
  addonCreditsExpiryAt?: string;
  subscriptionStatus?: string;
  subscriptionUpdatedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  status?: string;
};

type BlogPost = {
  id: string;
  title: string;
  contentHtml: string;
  contentText?: string;
  imageUrls?: string[];
  imagePaths?: string[];
  coverImageUrl?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Coupon = {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  createdAt?: string;
};

const Admin = () => {
  const auth = getFirebaseAuth();
  const [user, loading] = useAuthState(auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "suggestions" | "billing" | "blog" | "settings"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestionSearch, setSuggestionSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [checksToday, setChecksToday] = useState(0);
  const [wordsToday, setWordsToday] = useState(0);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogEditingId, setBlogEditingId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContentHtml, setBlogContentHtml] = useState("");
  const [blogContentText, setBlogContentText] = useState("");
  const [blogDateTime, setBlogDateTime] = useState("");
  const [blogImages, setBlogImages] = useState<
    Array<{ url?: string; path?: string; file?: File; preview: string }>
  >([]);
  const blogEditorRef = useRef<HTMLDivElement>(null);
  const [blogEditorKey, setBlogEditorKey] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState("");
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // User limit management
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [limitType, setLimitType] = useState<"unlimited" | "limited" | "disabled">("limited");
  const [wordLimitValue, setWordLimitValue] = useState("2000");
  const [creditsValue, setCreditsValue] = useState("50000");
  const [reactivatingUserId, setReactivatingUserId] = useState<string | null>(null);
  
  // Addon credits management
  const [addingCreditsUserId, setAddingCreditsUserId] = useState<string | null>(null);
  const [addonCreditsAmount, setAddonCreditsAmount] = useState("");
  const [addonCreditsExpiry, setAddonCreditsExpiry] = useState("");
  const [savingAddonCredits, setSavingAddonCredits] = useState(false);

  // All hooks must be called before any conditional returns
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestions = useMemo(() => {
    if (!suggestionSearch.trim()) return suggestions;
    const query = suggestionSearch.toLowerCase();
    return suggestions.filter(
      (item) =>
        item.message.toLowerCase().includes(query) ||
        (item.email || "").toLowerCase().includes(query)
    );
  }, [suggestions, suggestionSearch]);

  const proUsers = users.filter((user) => user.plan === "Pro").length;
  const totalUsers = users.length;
  const conversionRate = totalUsers ? Math.round((proUsers / totalUsers) * 100) : 0;
  const monthlyRevenue = proUsers * 500;
  const isToday = (iso?: string) => {
    if (!iso) return false;
    const date = new Date(iso);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };
  const newUsersToday = users.filter((user) => isToday(user.createdAt) || isToday(user.updatedAt)).length;

  const billingRows = useMemo(() => {
    return users
      .filter((user) => user.plan === "Pro" || user.subscriptionStatus)
      .map((user) => {
        const statusRaw = String(user.subscriptionStatus || "").toLowerCase();
        const statusLabel = statusRaw
          ? statusRaw === "active"
            ? "Paid"
            : statusRaw === "past_due"
              ? "Past Due"
              : "Cancelled"
          : user.plan === "Pro"
            ? "Paid"
            : "Free";
        return {
          name: user.email || user.name,
          plan: user.plan,
          amount: user.plan === "Pro" ? "₹500" : "₹0",
          status: statusLabel,
          date: user.updatedAt || user.createdAt || new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [users]);

  const toLocalInputValue = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (value: number) => String(value).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const resetBlogForm = () => {
    const nowIso = new Date().toISOString();
    setBlogEditingId(null);
    setBlogTitle("");
    setBlogContentHtml("");
    setBlogContentText("");
    setBlogDateTime(toLocalInputValue(nowIso));
    setBlogImages([]);
    setBlogEditorKey((prev) => prev + 1);
  };

  const handleReactivateUser = async (userId: string) => {
    const db = getFirebaseDb();
    if (!db) return;

    setReactivatingUserId(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "active",
        sessionId: "",
        sessionUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
      );
    } finally {
      setReactivatingUserId(null);
    }
  };

  useEffect(() => {
    if (!user) return; // Don't load data if not logged in
    
    const loadUsers = async () => {
      const db = getFirebaseDb();
      if (!db) return;
      const snap = await getDocs(collection(db, "users"));
      const list: AdminUser[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        const planField = String(data?.plan || "").toLowerCase();
        const entitlementPlan =
          Number(data?.wordLimit) >= 5000 || planField === "pro";
        const status = String(data?.subscriptionStatus || "").toLowerCase();
        const hasStatus = Boolean(status);
        const updatedAt = data?.subscriptionUpdatedAt
          ? new Date(String(data.subscriptionUpdatedAt))
          : null;
        const isRecent = updatedAt
          ? Date.now() - updatedAt.getTime() <= 1000 * 60 * 60 * 24 * 31
          : false;
        const isActive = status === "active" && (updatedAt ? isRecent : true);
        const effectivePlan = (hasStatus ? isActive && entitlementPlan : entitlementPlan)
          ? "Pro"
          : "Free";
        return {
          id: docSnap.id,
          name: data?.name || "User",
          email: data?.email || "",
          plan: effectivePlan,
          wordLimit: data?.wordLimit,
          credits: data?.credits,
          creditsUsed: data?.creditsUsed,
          addonCredits: data?.addonCredits,
          addonCreditsExpiryAt: data?.addonCreditsExpiryAt,
          subscriptionStatus: data?.subscriptionStatus,
          subscriptionUpdatedAt: data?.subscriptionUpdatedAt,
          updatedAt: data?.updatedAt,
          createdAt: data?.createdAt,
          status: data?.status || "active",
        };
      });
      setUsers(list);

      const docsSnap = await getDocs(collectionGroup(db, "docs"));
      setTotalDocs(docsSnap.size);

      // Calculate today's stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let wordsAll = 0;
      let checksTodayCount = 0;
      let wordsTodayCount = 0;

      docsSnap.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        const text = typeof data?.text === "string" ? data.text : "";
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        wordsAll += wordCount;

        // Check if document was created today
        const createdAt = data?.createdAt;
        if (createdAt) {
          const docDate = typeof createdAt === "string" 
            ? new Date(createdAt) 
            : createdAt?.toDate ? createdAt.toDate() : null;
          
          if (docDate && docDate >= todayStart) {
            checksTodayCount++;
            wordsTodayCount += wordCount;
          }
        }
      });

      setTotalWords(wordsAll);
      setChecksToday(checksTodayCount);
      setWordsToday(wordsTodayCount);
    };

    loadUsers();

    const loadSuggestions = async () => {
      try {
        const local = getSuggestions();
        const remote = await fetchRemoteSuggestions();
        setSuggestions(mergeSuggestions(local, remote));
      } catch (error) {
        console.error("Failed to load suggestions:", error);
        // Use local suggestions only if remote fails
        setSuggestions(getSuggestions());
      }
    };
    loadSuggestions();

    const loadBlogs = async () => {
      const db = getFirebaseDb();
      if (!db) return;
      setBlogLoading(true);
      try {
        const blogQuery = query(
          collection(db, "blogs"),
          orderBy("publishedAt", "desc")
        );
        const snap = await getDocs(blogQuery);
        const list: BlogPost[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          const contentHtml = String(data?.contentHtml || data?.content || "");
          const contentText = String(data?.contentText || "").trim();
          const imageUrls: string[] = Array.isArray(data?.imageUrls)
            ? data.imageUrls
            : data?.imageUrl
            ? [String(data.imageUrl)]
            : [];
          const imagePaths: string[] = Array.isArray(data?.imagePaths)
            ? data.imagePaths
            : data?.imagePath
            ? [String(data.imagePath)]
            : [];
          return {
            id: docSnap.id,
            title: data?.title || "",
            contentHtml,
            contentText,
            imageUrls,
            imagePaths,
            coverImageUrl: String(data?.coverImageUrl || imageUrls[0] || ""),
            publishedAt: data?.publishedAt,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
          };
        });
        setBlogPosts(list);
      } finally {
        setBlogLoading(false);
      }
    };
    loadBlogs();

    const handleStorage = () => loadSuggestions();
    window.addEventListener("correctnow:suggestions-updated", handleStorage);
    return () => window.removeEventListener("correctnow:suggestions-updated", handleStorage);
  }, [user]);

  useEffect(() => {
    const loadCoupons = async () => {
      const db = getFirebaseDb();
      if (!db) return;
      setCouponLoading(true);
      try {
        const snap = await getDocs(collection(db, "coupons"));
        const items: Coupon[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          return {
            id: docSnap.id,
            code: String(data.code || docSnap.id),
            percent: Number(data.percent || 0),
            active: Boolean(data.active ?? true),
            createdAt: String(data.createdAt || ""),
          };
        });
        items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setCoupons(items);
      } catch (err) {
        console.error("Failed to load coupons", err);
      } finally {
        setCouponLoading(false);
      }
    };
    loadCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    const db = getFirebaseDb();
    if (!db) return;
    const code = couponCode.trim().toUpperCase();
    const percent = Number(couponPercent);
    if (!code) {
      toast.error("Enter a coupon code");
      return;
    }
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      toast.error("Enter a valid percentage (1-100)");
      return;
    }
    setCouponSaving(true);
    try {
      const ref = doc(db, "coupons", code);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        toast.error("Coupon code already exists");
        return;
      }
      await setDoc(ref, {
        code,
        percent,
        active: true,
        createdAt: new Date().toISOString(),
      });
      setCoupons((prev) => [
        { id: code, code, percent, active: true, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setCouponCode("");
      setCouponPercent("");
      toast.success("Coupon created");
    } catch (err) {
      console.error("Failed to create coupon", err);
      toast.error("Failed to create coupon");
    } finally {
      setCouponSaving(false);
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await updateDoc(doc(db, "coupons", coupon.id), { active: !coupon.active });
      setCoupons((prev) =>
        prev.map((item) =>
          item.id === coupon.id ? { ...item, active: !coupon.active } : item
        )
      );
    } catch (err) {
      console.error("Failed to update coupon", err);
      toast.error("Failed to update coupon");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoginError(error.message || "Failed to login");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleEditUser = (userId: string, userData: AdminUser) => {
    setEditingUserId(userId);
    setWordLimitValue(String(userData.wordLimit || 2000));
    setCreditsValue(String(userData.credits || 50000));
    if (userData.wordLimit === 999999) {
      setLimitType("unlimited");
    } else if (userData.wordLimit === 0) {
      setLimitType("disabled");
    } else {
      setLimitType("limited");
    }
  };

  const handleAddAddonCredits = (userId: string, userData: AdminUser) => {
    setAddingCreditsUserId(userId);
    setAddonCreditsAmount("");
    // Default expiry to 30 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setAddonCreditsExpiry(defaultExpiry.toISOString().slice(0, 16));
  };

  const handleSaveAddonCredits = async () => {
    if (!addingCreditsUserId) return;
    
    const db = getFirebaseDb();
    if (!db) {
      toast.error("Database not available");
      return;
    }

    const amount = parseInt(addonCreditsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid credits amount");
      return;
    }

    if (!addonCreditsExpiry) {
      toast.error("Please select an expiry date");
      return;
    }

    setSavingAddonCredits(true);
    try {
      const userRef = doc(db, "users", addingCreditsUserId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      // Get current addon credits
      const currentAddon = Number(userData?.addonCredits || 0);
      const currentExpiry = userData?.addonCreditsExpiryAt;
      
      // Check if current credits are still valid
      const now = new Date();
      const isCurrentValid = currentExpiry 
        ? new Date(String(currentExpiry)).getTime() > now.getTime() 
        : false;
      
      // Add to existing if still valid, otherwise replace
      const newAddonCredits = isCurrentValid ? currentAddon + amount : amount;
      
      await updateDoc(userRef, {
        addonCredits: newAddonCredits,
        addonCreditsExpiryAt: addonCreditsExpiry,
        creditsUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === addingCreditsUserId
            ? { 
                ...u, 
                addonCredits: newAddonCredits,
                addonCreditsExpiryAt: addonCreditsExpiry,
              }
            : u
        )
      );

      toast.success(`Added ${amount.toLocaleString()} credits successfully!`);
      setAddingCreditsUserId(null);
      setAddonCreditsAmount("");
      setAddonCreditsExpiry("");
    } catch (error) {
      console.error("Failed to add addon credits:", error);
      toast.error("Failed to add credits");
    } finally {
      setSavingAddonCredits(false);
    }
  };

  const handleSaveUserLimits = async () => {
    if (!editingUserId) return;
    
    const db = getFirebaseDb();
    if (!db) return;

    try {
      const updates: any = {};
      
      if (limitType === "unlimited") {
        updates.wordLimit = 999999;
        updates.credits = 999999;
        updates.plan = "pro";
      } else if (limitType === "disabled") {
        updates.wordLimit = 0;
        updates.credits = 0;
        updates.plan = "free";
      } else {
        const wordLimit = parseInt(wordLimitValue);
        const credits = parseInt(creditsValue);
        updates.wordLimit = isNaN(wordLimit) ? 2000 : wordLimit;
        updates.credits = isNaN(credits) ? 50000 : credits;
      }

      updates.updatedAt = new Date().toISOString();

      const userRef = doc(db, "users", editingUserId);
      await updateDoc(userRef, updates);

      // Reload users
      const snap = await getDocs(collection(db, "users"));
      const list: AdminUser[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        return {
          id: docSnap.id,
          name: data?.name || "User",
          email: data?.email || "",
          plan: String(data?.plan || "free").toLowerCase() === "pro" ? "Pro" : "Free",
          wordLimit: data?.wordLimit,
          credits: data?.credits,
          creditsUsed: data?.creditsUsed,
          subscriptionStatus: data?.subscriptionStatus,
          updatedAt: data?.updatedAt,
          createdAt: data?.createdAt,
        };
      });
      setUsers(list);
      setEditingUserId(null);
    } catch (error) {
      console.error("Failed to update user limits:", error);
      alert("Failed to update user limits");
    }
  };

  const handleBlogImagesChange = (files?: FileList | null) => {
    if (!files || !files.length) return;
    const next = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setBlogImages((prev) => [...prev, ...next]);
  };

  const removeBlogImage = (index: number) => {
    setBlogImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleEditBlog = (post: BlogPost) => {
    setBlogEditingId(post.id);
    setBlogTitle(post.title || "");
    setBlogContentHtml(post.contentHtml || "");
    setBlogContentText(post.contentText || "");
    setBlogDateTime(toLocalInputValue(post.publishedAt));
    setBlogImages(
      (post.imageUrls || []).map((url, idx) => ({
        url,
        path: post.imagePaths?.[idx],
        preview: url,
      }))
    );
    setBlogEditorKey((prev) => prev + 1);
  };

  const syncBlogContentState = (html: string) => {
    setBlogContentHtml(html);
    const text = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    setBlogContentText(text);
  };

  const applyBlogCommand = (command: string, value?: string) => {
    const target = blogEditorRef.current;
    if (!target) return;
    target.focus();
    
    // For headings and blockquote, wrap selected text only
    if (command === 'formatBlock' && (value === '<h2>' || value === '<h3>' || value === '<blockquote>')) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Create the appropriate element
        const tagName = value.replace(/[<>]/g, '');
        const element = document.createElement(tagName);
        element.textContent = selectedText;
        
        // Replace selection with new element
        range.deleteContents();
        range.insertNode(element);
        
        // Add a line break after if needed
        const br = document.createElement('br');
        element.parentNode?.insertBefore(br, element.nextSibling);
        
        // Move cursor after the element
        const newRange = document.createRange();
        newRange.setStartAfter(element);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // No selection, just apply to current line
        document.execCommand(command, false, value);
      }
    } else {
      // For other commands (bold, italic, underline, lists), use normal execCommand
      document.execCommand(command, false, value);
    }
    
    syncBlogContentState(target.innerHTML);
  };

  const handleBlogKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+U for underline
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      applyBlogCommand('underline');
    }
  };

  const handleBlogLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    applyBlogCommand("createLink", url);
  };

  const handleSaveBlog = async () => {
    const db = getFirebaseDb();
    if (!db) return;
    const plainText = blogContentText || blogContentHtml.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!blogTitle.trim() || !plainText) {
      toast.error("Title and content are required");
      return;
    }

    setBlogSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const publishedAtIso = blogDateTime
        ? new Date(blogDateTime).toISOString()
        : nowIso;

      const existing = blogEditingId
        ? blogPosts.find((post) => post.id === blogEditingId)
        : null;

      const docRef = blogEditingId
        ? doc(db, "blogs", blogEditingId)
        : doc(collection(db, "blogs"));

      const storage = getFirebaseStorage();
      const retainedExisting = blogImages.filter((item) => !item.file && item.url);
      const retainedPaths = retainedExisting
        .map((item) => item.path)
        .filter((value): value is string => Boolean(value));
      const existingPaths = existing?.imagePaths || [];
      const removedPaths = existingPaths.filter((path) => !retainedPaths.includes(path));

      if (storage && removedPaths.length) {
        await Promise.all(
          removedPaths.map((path) =>
            deleteObject(storageRef(storage, path)).catch(() => null)
          )
        );
      }

      let uploaded: Array<{ url: string; path: string }> = [];
      if (storage) {
        const newFiles = blogImages.filter((item) => item.file);
        uploaded = await Promise.all(
          newFiles.map(async (item) => {
            const file = item.file as File;
            const path = `blog-images/${docRef.id}/${Date.now()}-${file.name}`;
            const fileRef = storageRef(storage, path);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            return { url, path };
          })
        );
      }

      const finalImageUrls = [
        ...retainedExisting.map((item) => item.url as string),
        ...uploaded.map((item) => item.url),
      ];
      const finalImagePaths = [
        ...retainedPaths,
        ...uploaded.map((item) => item.path),
      ];

      const payload: BlogPost = {
        id: docRef.id,
        title: blogTitle.trim(),
        contentHtml: blogContentHtml.trim(),
        contentText: plainText,
        imageUrls: finalImageUrls,
        imagePaths: finalImagePaths,
        coverImageUrl: finalImageUrls[0] || "",
        publishedAt: publishedAtIso,
        updatedAt: nowIso,
        createdAt: existing?.createdAt || nowIso,
      };

      await setDoc(docRef, payload, { merge: true });

      setBlogPosts((prev) => {
        const next = blogEditingId
          ? prev.map((post) => (post.id === docRef.id ? payload : post))
          : [payload, ...prev];
        return [...next].sort((a, b) =>
          new Date(b.publishedAt || b.createdAt || 0).getTime() -
          new Date(a.publishedAt || a.createdAt || 0).getTime()
        );
      });

      toast.success(blogEditingId ? "Blog post updated" : "Blog post created");
      resetBlogForm();
    } finally {
      setBlogSaving(false);
    }
  };

  const handleDeleteBlog = async (post: BlogPost) => {
    const db = getFirebaseDb();
    if (!db) return;
    const confirmed = window.confirm("Delete this blog post? This cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "blogs", post.id));
      const storage = getFirebaseStorage();
      const paths = post.imagePaths || [];
      if (storage && paths.length) {
        await Promise.all(
          paths.map((path) => deleteObject(storageRef(storage, path)).catch(() => null))
        );
      }
      setBlogPosts((prev) => prev.filter((item) => item.id !== post.id));
      toast.success("Blog post deleted");
      if (blogEditingId === post.id) {
        resetBlogForm();
      }
    } catch {
      toast.error("Failed to delete blog post");
    }
  };

  // Show login form if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="w-full max-w-md p-8">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Admin Login</h1>
            <p className="text-center text-muted-foreground mb-8">
              Sign in to access the admin panel
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-accent hover:text-accent/80"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loggingIn}
              >
                {loggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img
                src="/Icon/correctnow logo final2.png"
                alt="CorrectNow"
                className="h-24 w-auto object-contain"
                loading="eager"
              />
            </Link>
            <Badge variant="secondary">Admin</Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-sm font-medium text-accent-foreground">A</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <nav className="space-y-1">
              {[
                { id: "overview", icon: BarChart3, label: "Dashboard" },
                { id: "users", icon: Users, label: "Users" },
                { id: "suggestions", icon: MessageSquare, label: "Suggestions" },
                { id: "blog", icon: FileText, label: "Blog" },
                { id: "billing", icon: CreditCard, label: "Billing & Plans" },
                { id: "settings", icon: Settings, label: "Settings" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
              <button 
                onClick={() => auth.signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Admin Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Overview of platform activity and metrics
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        Total Users
                      </span>
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {totalUsers.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total registered users
                    </p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        Active Pro Users
                      </span>
                      <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {proUsers}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pro plan subscribers
                    </p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        Checks Today
                      </span>
                      <CheckCircle className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {checksToday.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total all time: {totalDocs.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        Words Processed
                      </span>
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {wordsToday >= 1000 
                        ? `${(wordsToday / 1000).toFixed(1)}K` 
                        : wordsToday}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Today (Total: {(totalWords / 1000).toFixed(0)}K)
                    </p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        Pro Subscribers
                      </span>
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {proUsers}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversionRate}% conversion
                    </p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        Monthly Revenue
                      </span>
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      ₹{monthlyRevenue.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on active Pro users
                    </p>
                  </div>
                </div>

                {/* Daily Stats Table */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      Daily Activity
                    </h2>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                            Date
                          </th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                            Checks
                          </th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                            Words
                          </th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                            New Users
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border last:border-0">
                          <td className="py-3 text-sm text-foreground">Today</td>
                          <td className="py-3 text-sm text-foreground">{checksToday}</td>
                          <td className="py-3 text-sm text-foreground">
                            {wordsToday >= 1000 
                              ? `${(wordsToday / 1000).toFixed(1)}K` 
                              : wordsToday}
                          </td>
                          <td className="py-3 text-sm text-foreground">+{newUsersToday}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                      Users
                    </h1>
                    <p className="text-muted-foreground">
                      Manage all registered users
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Users
                  </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {/* Users Table */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            User
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Plan
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Credits
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Addon Credits
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Usage
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Word Limit
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Joined
                          </th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                  <span className="text-xs font-medium text-accent-foreground">
                                    {user.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge
                                variant={
                                  user.plan === "Pro"
                                    ? "default"
                                    : user.plan === "Team"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {user.plan}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <Badge
                                variant={user.status === "deactivated" ? "destructive" : "outline"}
                              >
                                {user.status === "deactivated" ? "Deactivated" : "Active"}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-sm text-foreground">
                              {user.credits ? user.credits.toLocaleString() : "—"}
                            </td>
                            <td className="py-4 px-6">
                              {user.addonCredits && user.addonCredits > 0 ? (
                                <div className="flex flex-col">
                                  <span className="text-sm text-foreground font-medium">
                                    {user.addonCredits.toLocaleString()}
                                  </span>
                                  {user.addonCreditsExpiryAt && (
                                    <span className="text-xs text-muted-foreground">
                                      Expires: {new Date(user.addonCreditsExpiryAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-sm text-foreground">
                              {user.credits
                                ? `${(user.creditsUsed || 0).toLocaleString()} / ${user.credits.toLocaleString()}`
                                : "—"}
                            </td>
                            <td className="py-4 px-6 text-sm text-foreground">
                              {user.wordLimit ? user.wordLimit.toLocaleString() : "—"}
                            </td>
                            <td className="py-4 px-6 text-sm text-muted-foreground">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : user.updatedAt
                                ? new Date(user.updatedAt).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {user.status === "deactivated" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReactivateUser(user.id)}
                                    disabled={reactivatingUserId === user.id}
                                  >
                                    {reactivatingUserId === user.id ? "Reactivating..." : "Reactivate"}
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleAddAddonCredits(user.id, user)}
                                  title="Add Addon Credits"
                                >
                                  <Coins className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditUser(user.id, user)}
                                >
                                  Manage Limits
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit User Limits Dialog */}
                {editingUserId && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Manage User Limits
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            htmlFor="limit-type-select"
                          >
                            Limit Type
                          </label>
                          <select
                            id="limit-type-select"
                            aria-label="Select user limit type"
                            value={limitType}
                            onChange={(e) => setLimitType(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                          >
                            <option value="limited">Limited</option>
                            <option value="unlimited">Unlimited</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>

                        {limitType === "limited" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-2">Word Limit</label>
                              <Input
                                type="number"
                                value={wordLimitValue}
                                onChange={(e) => setWordLimitValue(e.target.value)}
                                placeholder="2000"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Credits</label>
                              <Input
                                type="number"
                                value={creditsValue}
                                onChange={(e) => setCreditsValue(e.target.value)}
                                placeholder="50000"
                              />
                            </div>
                          </>
                        )}

                        {limitType === "unlimited" && (
                          <p className="text-sm text-muted-foreground">
                            User will have unlimited word limit and credits
                          </p>
                        )}

                        {limitType === "disabled" && (
                          <p className="text-sm text-destructive">
                            User will be unable to use the service
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button onClick={handleSaveUserLimits} className="flex-1">
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingUserId(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Addon Credits Dialog */}
                {addingCreditsUserId && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                          <Coins className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Add Addon Credits
                        </h3>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Add additional credits with a custom expiry date. These credits will be added on top of existing valid credits.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Credits Amount
                          </label>
                          <Input
                            type="number"
                            value={addonCreditsAmount}
                            onChange={(e) => setAddonCreditsAmount(e.target.value)}
                            placeholder="10000"
                            min="1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter the number of credits to add
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Expiry Date & Time
                          </label>
                          <Input
                            type="datetime-local"
                            value={addonCreditsExpiry}
                            onChange={(e) => setAddonCreditsExpiry(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Credits will expire at the selected date and time
                          </p>
                        </div>

                        <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                          <p className="text-xs text-foreground font-medium mb-1">
                            📌 How it works:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• If user has valid addon credits, new amount will be added</li>
                            <li>• If existing credits expired, they will be replaced</li>
                            <li>• User can see expiry date in their dashboard</li>
                            <li>• Credits automatically expire at the set date</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button 
                          onClick={handleSaveAddonCredits} 
                          className="flex-1"
                          disabled={savingAddonCredits}
                        >
                          {savingAddonCredits ? "Adding..." : "Add Credits"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAddingCreditsUserId(null);
                            setAddonCreditsAmount("");
                            setAddonCreditsExpiry("");
                          }}
                          className="flex-1"
                          disabled={savingAddonCredits}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "suggestions" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                      Suggestions
                    </h1>
                    <p className="text-muted-foreground">
                      User ideas and product feedback
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suggestions..."
                      value={suggestionSearch}
                      onChange={(e) => setSuggestionSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Message
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            User
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                            Date
                          </th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuggestions.length ? (
                          filteredSuggestions.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-4 px-6 text-sm text-foreground max-w-xl">
                                {item.message}
                              </td>
                              <td className="py-4 px-6 text-sm text-muted-foreground">
                                {item.email || "Anonymous"}
                              </td>
                              <td className="py-4 px-6">
                                <Badge
                                  variant={
                                    item.status === "resolved"
                                      ? "secondary"
                                      : item.status === "reviewed"
                                      ? "default"
                                      : "outline"
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-sm text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateSuggestionStatus(item.id, "reviewed")}
                                  >
                                    Mark reviewed
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateSuggestionStatus(item.id, "resolved")}
                                  >
                                    Resolve
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-8 text-center text-sm text-muted-foreground" colSpan={5}>
                              No suggestions yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "blog" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                      Blog
                    </h1>
                    <p className="text-muted-foreground">
                      Create, edit, and publish blog posts
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={resetBlogForm}>
                      New Post
                    </Button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        value={blogTitle}
                        onChange={(e) => setBlogTitle(e.target.value)}
                        placeholder="Blog post title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Content</label>
                      <div className="rounded-lg border border-border bg-background">
                        <div className="flex flex-wrap gap-2 border-b border-border p-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("undo")}
                            title="Undo (Ctrl+Z)">
                            <Undo className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("redo")}
                            title="Redo (Ctrl+Y)">
                            <Redo className="w-4 h-4" />
                          </Button>
                          <div className="w-px bg-border" />
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("bold")}
                            title="Bold (Ctrl+B)">
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("italic")}
                            title="Italic (Ctrl+I)">
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("underline")}
                            title="Underline (Ctrl+U)">
                            <Underline className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("formatBlock", "<h2>")}
                            title="Heading 2">
                            <Heading2 className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("formatBlock", "<h3>")}
                            title="Heading 3">
                            <Heading3 className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("insertUnorderedList")}
                            title="Bullet list">
                            <List className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("insertOrderedList")}
                            title="Numbered list">
                            <ListOrdered className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlogCommand("formatBlock", "<blockquote>")}
                            title="Quote">
                            <Quote className="w-4 h-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={handleBlogLink}
                            title="Insert link">
                            <Link2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div
                          key={blogEditorKey}
                          ref={blogEditorRef}
                          className="min-h-[220px] p-3 text-sm leading-relaxed focus:outline-none"
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) => syncBlogContentState(e.currentTarget.innerHTML)}
                          onKeyDown={handleBlogKeyDown}
                          dangerouslySetInnerHTML={{ __html: blogContentHtml }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Style your content like WordPress: headings, bold/italic, lists, quotes, and links.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Publish date & time</label>
                      <Input
                        type="datetime-local"
                        value={blogDateTime}
                        onChange={(e) => setBlogDateTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Images</label>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleBlogImagesChange(e.target.files)}
                      />
                      {blogImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {blogImages.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={img.preview}
                                alt={`Blog image ${idx + 1}`}
                                className="w-full h-28 object-cover rounded-lg border border-border"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-1 right-1 bg-background/80"
                                onClick={() => removeBlogImage(idx)}
                                title="Remove image"
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload multiple images. The first image will be used as the cover.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleSaveBlog} disabled={blogSaving}>
                        {blogSaving
                          ? "Saving..."
                          : blogEditingId
                            ? "Update Post"
                            : "Publish Post"}
                      </Button>
                      {blogEditingId && (
                        <Button variant="outline" onClick={resetBlogForm}>
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Live Preview Panel */}
                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-lg font-semibold">Live Preview</h3>
                      <Badge variant="secondary">Auto-updating</Badge>
                    </div>
                    
                    {/* Preview Header */}
                    <div className="space-y-3">
                      {blogTitle ? (
                        <h1 className="text-3xl font-bold text-foreground">{blogTitle}</h1>
                      ) : (
                        <h1 className="text-3xl font-bold text-muted-foreground italic">Untitled Post</h1>
                      )}
                      {blogDateTime && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(blogDateTime).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    
                    {/* Cover Image Preview */}
                    {blogImages.length > 0 && (
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                        <img
                          src={blogImages[0].preview}
                          alt="Cover preview"
                          className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage(blogImages[0].preview)}
                        />
                      </div>
                    )}
                    
                    {/* Content Preview */}
                    <div className="border-t border-border pt-4">
                      <div className="blog-content prose max-w-none">
                        {blogContentHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: blogContentHtml }} />
                        ) : (
                          <p className="text-muted-foreground italic">Start typing to see preview...</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Image Gallery Preview */}
                    {blogImages.length > 1 && (
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-semibold mb-3">Gallery Images</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {blogImages.slice(1).map((img, idx) => (
                            <div key={idx} className="w-full h-32 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                              <img
                                src={img.preview}
                                alt={`Gallery ${idx + 1}`}
                                className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setLightboxImage(img.preview)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Image Lightbox */}
                {lightboxImage && (
                  <div 
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-white hover:bg-white/20"
                      onClick={() => setLightboxImage(null)}
                    >
                      <X className="w-6 h-6" />
                    </Button>
                    <img
                      src={lightboxImage}
                      alt="Full size preview"
                      className="max-w-full max-h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                {/* Blog Posts List */}
                <div className="mt-6 bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-foreground">All Posts</h2>
                      <span className="text-sm text-muted-foreground">
                        {blogPosts.length} total
                      </span>
                    </div>
                    {blogLoading ? (
                      <p className="text-sm text-muted-foreground">Loading posts...</p>
                    ) : blogPosts.length ? (
                      <div className="space-y-4">
                        {blogPosts.map((post) => (
                          <div
                            key={post.id}
                            className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border"
                          >
                            {(post.coverImageUrl || post.imageUrls?.[0]) && (
                              <img
                                src={post.coverImageUrl || post.imageUrls?.[0]}
                                alt={post.title}
                                className="w-full sm:w-32 h-24 object-cover rounded-md border border-border"
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h3 className="font-semibold text-foreground">
                                  {post.title}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {post.publishedAt
                                    ? new Date(post.publishedAt).toLocaleString()
                                    : "Unscheduled"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.contentText || post.contentHtml.replace(/<[^>]*>/g, " ").trim()}
                              </p>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditBlog(post)}>
                                  Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteBlog(post)}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No blog posts yet.</p>
                    )}
                  </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Billing & Plans
                  </h1>
                  <p className="text-muted-foreground">
                    Manage subscriptions, payments, and revenue
                  </p>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Coupons</h2>
                      <p className="text-sm text-muted-foreground">Create discount codes for Pro subscriptions</p>
                    </div>
                    <div className="text-xs text-muted-foreground">Not applicable to add-on credits</div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_auto]">
                    <div>
                      <label className="text-sm text-muted-foreground">Coupon code</label>
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="SAVE10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Discount %</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={couponPercent}
                        onChange={(e) => setCouponPercent(e.target.value)}
                        placeholder="10"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="accent"
                        onClick={handleCreateCoupon}
                        disabled={couponSaving}
                      >
                        {couponSaving ? "Saving..." : "Create"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6">
                    {couponLoading ? (
                      <p className="text-sm text-muted-foreground">Loading coupons...</p>
                    ) : coupons.length ? (
                      <div className="space-y-3">
                        {coupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border p-4"
                          >
                            <div>
                              <div className="text-sm font-semibold text-foreground">{coupon.code}</div>
                              <div className="text-xs text-muted-foreground">{coupon.percent}% off</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={coupon.active ? "secondary" : "outline"}>
                                {coupon.active ? "Active" : "Inactive"}
                              </Badge>
                              <Button variant="outline" size="sm" onClick={() => handleToggleCoupon(coupon)}>
                                {coupon.active ? "Disable" : "Enable"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No coupons created yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">MRR</span>
                      <CreditCard className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">₹{monthlyRevenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">Based on active Pro users</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{proUsers.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">Active Pro plans</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Churn</span>
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{conversionRate}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Pro conversion</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Refunds</span>
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">₹0</p>
                    <p className="text-sm text-muted-foreground mt-1">No refunds tracked</p>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      Recent Payments
                    </h2>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Customer</th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Plan</th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingRows.length ? (
                          billingRows.map((payment) => (
                            <tr key={`${payment.name}-${payment.date}`} className="border-b border-border last:border-0">
                              <td className="py-3 text-sm text-foreground">{payment.name}</td>
                              <td className="py-3 text-sm text-foreground">{payment.plan}</td>
                              <td className="py-3 text-sm text-foreground">{payment.amount}</td>
                              <td className="py-3 text-sm">
                                <Badge variant="secondary">{payment.status}</Badge>
                              </td>
                              <td className="py-3 text-sm text-muted-foreground">
                                {new Date(payment.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-8 text-center text-sm text-muted-foreground" colSpan={5}>
                              No billing activity yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Settings
                  </h1>
                  <p className="text-muted-foreground">
                    Platform configuration and preferences
                  </p>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    API Configuration
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Gemini API Status
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-foreground">Connected</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Update API Key
                    </Button>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Rate Limits
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Free Plan - Words/Check
                      </label>
                      <p className="text-foreground font-medium">200</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Free Plan - Monthly Words
                      </label>
                      <p className="text-foreground font-medium">Limited</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Pro Plan - Words/Check
                      </label>
                      <p className="text-foreground font-medium">5,000</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Pro Plan - Monthly Words
                      </label>
                      <p className="text-foreground font-medium">50,000</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
