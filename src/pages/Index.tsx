import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileText, Search, Star, LogOut, User, Menu } from "lucide-react";
import { formatUpdated, getDocs, sectionForDate } from "@/lib/docs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { addSuggestion } from "@/lib/suggestions";
import { toast } from "sonner";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { deleteUser, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs as getFirestoreDocs, setDoc } from "firebase/firestore";
import { clearSessionId } from "@/lib/session";

const Index = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [docs, setDocs] = useState<Array<{
    id: string;
    title: string;
    preview: string;
    text: string;
    updatedAt: string;
    section: string;
    updated: string;
  }>>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [sidebarView, setSidebarView] = useState<"docs" | "account">("docs");
  const [userProfile, setUserProfile] = useState<{
    plan: string;
    wordLimit: number;
    creditsUsed: number;
    subscriptionStatus: string;
    addonCredits: number;
    addonCreditsExpiryAt: string | null;
  } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = auth
      ? onAuthStateChanged(auth, async (user) => {
          setIsAuthenticated(Boolean(user));
          setUserEmail(user?.email || "");
          
          // Only load docs for authenticated users
          if (user) {
            const userDocs = getDocs().map((doc) => ({
              ...doc,
              section: sectionForDate(doc.updatedAt),
              updated: formatUpdated(doc.updatedAt),
            }));
            setDocs(userDocs);
          } else {
            // Clear docs for non-authenticated users
            setDocs([]);
          }
          
          // Fetch user profile from Firestore
          if (user) {
            setIsLoadingProfile(true);
            const db = getFirebaseDb();
            if (db) {
              try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                  const data = userDoc.data();
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
                    ? "pro"
                    : "free";

                  setUserProfile({
                    plan: effectivePlan,
                    wordLimit: data.wordLimit || 1000,
                    creditsUsed: data.creditsUsed || 0,
                    subscriptionStatus: data.subscriptionStatus || "inactive",
                    addonCredits: data.addonCredits || 0,
                    addonCreditsExpiryAt: data.addonCreditsExpiryAt || null,
                  });
                } else {
                  // User document doesn't exist, set defaults
                  console.log("User document not found, using defaults");
                  setUserProfile({
                    plan: "free",
                    wordLimit: 1000,
                    creditsUsed: 0,
                    subscriptionStatus: "inactive",
                    addonCredits: 0,
                    addonCreditsExpiryAt: null,
                  });
                }
              } catch (error) {
                console.error("Error fetching user profile:", error);
                // Set defaults on error
                setUserProfile({
                  plan: "free",
                  wordLimit: 1000,
                  creditsUsed: 0,
                  subscriptionStatus: "inactive",
                  addonCredits: 0,
                  addonCreditsExpiryAt: null,
                });
              } finally {
                setIsLoadingProfile(false);
              }
            }
          } else {
            setUserProfile(null);
          }
          
          setIsAuthLoading(false);
        })
      : undefined;
    
    if (!auth) {
      setIsAuthLoading(false);
    }

    const loadDocs = () =>
      setDocs(
        getDocs().map((doc) => ({
          ...doc,
          section: sectionForDate(doc.updatedAt),
          updated: formatUpdated(doc.updatedAt),
        }))
      );

    loadDocs();

    const handleFocus = () => loadDocs();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "correctnow:docs") {
        loadDocs();
      }
    };
    const handleDocsUpdated = () => loadDocs();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("correctnow:docs-updated", handleDocsUpdated);

    return () => {
      if (unsub) unsub();
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("correctnow:docs-updated", handleDocsUpdated);
    };
  }, [location.key]);

  const filtered = useMemo(
    () =>
      docs.filter((doc) =>
        `${doc.title} ${doc.preview}`.toLowerCase().includes(query.toLowerCase())
      ),
    [docs, query]
  );

  const sections = useMemo(
    () =>
      ["Today", "Yesterday"].filter((section) =>
        filtered.some((doc) => doc.section === section)
      ),
    [filtered]
  );

  const openDoc = (id: string) => {
    navigate("/editor", { state: { id } });
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      toast.error("Please enter a suggestion.");
      return;
    }
    setIsSubmittingSuggestion(true);
    try {
      const auth = getFirebaseAuth();
      await addSuggestion({
        message: suggestionText,
        email: auth?.currentUser?.email || "",
        userId: auth?.currentUser?.uid || "",
      });
      setSuggestionText("");
      setIsSuggestionOpen(false);
      toast.success("Thanks! Your suggestion was submitted.");
    } catch {
      toast.error("Unable to submit suggestion.");
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
        toast.success("Signed out successfully");
        navigate("/");
      } catch (error) {
        toast.error("Failed to sign out");
      }
    }
  };

  const handleDeleteAccount = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth?.currentUser || !db) {
      toast.error("Unable to delete account.");
      return;
    }

    setIsDeleting(true);
    try {
      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);

      const docsSnap = await getFirestoreDocs(collection(db, `users/${uid}/docs`));
      await Promise.all(docsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)));

      await deleteDoc(userRef);
      window.localStorage.removeItem("correctnow:docs");

      await deleteUser(auth.currentUser);
      clearSessionId();
      toast.success("Your account was permanently deleted.");
      navigate("/");
    } catch (error: any) {
      if (error?.code === "auth/requires-recent-login") {
        toast.error("Please log in again to delete your account.");
      } else {
        toast.error("Failed to delete account.");
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Navigation */}
      <div className="py-4">
        <nav className="space-y-1 px-3">
          <button
            onClick={() => {
              setSidebarView("docs");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sidebarView === "docs"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Docs
          </button>
          
          <button
            onClick={() => {
              setSidebarView("account");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sidebarView === "account"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            Account
          </button>

          <div className="h-4" />

          <button
            onClick={() => {
              handleSignOut();
              setIsMobileSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>

          <div className="mt-2 px-3">
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Header />
      
      {isAuthLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          {isAuthenticated ? (
            // Authenticated Layout with Left Sidebar
            <div className="flex-1 flex overflow-hidden">
              {/* Desktop Left Sidebar - Hidden on mobile */}
              <div className="hidden md:flex w-56 border-r border-border bg-background flex-col">
                <SidebarContent />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-auto">
                {/* Mobile Header with Hamburger */}
                <div className="md:hidden border-b border-border bg-background p-3 flex items-center gap-3">
                  <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                      <SidebarContent />
                    </SheetContent>
                  </Sheet>
                  <h1 className="text-lg font-semibold text-foreground">
                    {sidebarView === "docs" ? "Docs" : "Account"}
                  </h1>
                </div>

                {sidebarView === "docs" && (
                  <>
                    <div className="container pt-3 pb-2">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <h1 className="text-2xl font-semibold text-foreground">Docs</h1>
                        <div className="flex items-center gap-2">
                          <Button variant="accent" size="sm" className="h-9 blink-green-slow" onClick={() => navigate("/editor")}>
                            <FileText className="w-4 h-4 mr-2" />
                            New doc
                          </Button>
                        </div>
                      </div>
                      <div className="relative w-full sm:max-w-md mt-3">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          className="pl-9"
                          placeholder="Search docs"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <main className="pt-2 pb-8">
                      <div className="container">
                        {filtered.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-center py-16">
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                              Your checked documents will appear here. Start by checking your first document.
                            </p>
                            <Button variant="accent" onClick={() => navigate("/editor")}>
                              <FileText className="w-4 h-4 mr-2" />
                              Create your first document
                            </Button>
                          </div>
                        ) : (
                          sections.map((section) => (
                            <div key={section} className="mb-8">
                              <div className="text-sm font-semibold text-muted-foreground mb-3">{section}</div>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filtered
                                  .filter((doc) => doc.section === section)
                                  .map((doc) => (
                                    <Card key={doc.id} className="hover:shadow-card transition-shadow cursor-pointer" onClick={() => openDoc(doc.id)}>
                                      <CardContent className="p-5 min-h-[140px]">
                                        <div className="flex items-start gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-primary" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                                              {doc.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                              {doc.preview}
                                            </p>
                                            <div className="text-xs text-muted-foreground mt-2">{doc.updated}</div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </main>
                  </>
                )}

                {sidebarView === "account" && (
                  <div className="container pt-6">
                    <h1 className="text-2xl font-semibold text-foreground mb-6">Account</h1>
                    {isLoadingProfile ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="max-w-2xl space-y-6">
                        <Card>
                          <CardContent className="p-6">
                            <h3 className="text-base font-semibold text-foreground mb-4">Profile Information</h3>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Email</span>
                                <span className="text-sm font-medium text-foreground">{userEmail}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <h3 className="text-base font-semibold text-foreground mb-4">Usage Statistics</h3>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Word Limit</span>
                                <span className="text-sm font-medium text-foreground">{userProfile?.wordLimit?.toLocaleString() || "1,000"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Credits Used</span>
                                <span className="text-sm font-medium text-foreground">{userProfile?.creditsUsed?.toLocaleString() || "0"}</span>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Usage</span>
                                  <span className="text-sm font-medium text-foreground">
                                    {Math.min(100, ((userProfile?.creditsUsed || 0) / (userProfile?.wordLimit || 1000)) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all" 
                                    style={{ 
                                      width: `${Math.min(100, ((userProfile?.creditsUsed || 0) / (userProfile?.wordLimit || 1000)) * 100)}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <h3 className="text-base font-semibold text-foreground mb-4">Subscription</h3>
                            <div className="space-y-3">
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Plan</span>
                                  <span className="font-semibold text-foreground capitalize">{userProfile?.plan || "free"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Status</span>
                                  <span className="font-semibold text-foreground capitalize">{userProfile?.subscriptionStatus || "inactive"}</span>
                                </div>
                              </div>
                              {(() => {
                                const expiry = userProfile?.addonCreditsExpiryAt
                                  ? new Date(String(userProfile.addonCreditsExpiryAt))
                                  : null;
                                const isValid = expiry ? expiry.getTime() > Date.now() : false;
                                const addonTotal = isValid ? (userProfile?.addonCredits || 0) : 0;
                                const expiryLabel = expiry
                                  ? isValid
                                    ? expiry.toLocaleDateString()
                                    : "Expired"
                                  : "—";
                                const baseLimit = userProfile?.wordLimit || 0;
                                const totalUsed = userProfile?.creditsUsed || 0;
                                const addonUsed = Math.max(0, totalUsed - baseLimit);
                                const addonRemaining = Math.max(0, addonTotal - addonUsed);
                                return (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Add-on credits</span>
                                      <span className="font-semibold text-foreground">{addonTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Add-on used</span>
                                      <span className="font-semibold text-foreground">{addonUsed.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Add-on remaining</span>
                                      <span className="font-semibold text-foreground">{addonRemaining.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Add-on expiry</span>
                                      <span className="font-semibold text-foreground">{expiryLabel}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => navigate("/pricing")}
                              >
                                Manage Plan
                              </Button>
                              <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => navigate("/payment?mode=credits")}
                              >
                                Buy add-on credits
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Add-on credits are valid for 30 days.
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <h3 className="text-base font-semibold text-foreground mb-4">Account Security</h3>
                            <div className="space-y-3">
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setIsDeleteOpen(true)}
                              >
                                Delete Account Permanently
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {userProfile?.plan === "free" && (
                          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                            <CardContent className="p-6">
                              <h4 className="text-base font-semibold text-foreground mb-2">Upgrade to Pro</h4>
                              <p className="text-sm text-muted-foreground mb-4">Get unlimited checks and advanced features</p>
                              <Button onClick={() => navigate("/pricing")}>View Plans</Button>
                            </CardContent>
                          </Card>
                        )}

                        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete account permanently?</DialogTitle>
                            </DialogHeader>
                            <div className="text-sm text-muted-foreground">
                              This will permanently erase your account and all data. This action cannot be undone.
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDeleteOpen(false)}
                                disabled={isDeleting}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete Permanently"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            // Non-authenticated Layout (Hero + Recent Docs)
            <>
              <div className="container pt-3 pb-2">
                <div className="flex items-center justify-end">
                  <Button variant="accent" size="sm" className="h-9 blink-green-slow" onClick={() => navigate("/editor")}>New doc</Button>
                </div>
              </div>

              <main className="flex-1 pt-2 pb-0">
            {!isAuthenticated && (
        <section className="mb-0">
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white shadow-[0_20px_60px_rgba(37,99,235,0.3)] md:shadow-[0_30px_80px_rgba(37,99,235,0.35)]">
            <div className="absolute inset-0 opacity-20 md:opacity-25">
              <div className="absolute -top-16 sm:-top-24 -right-12 sm:-right-20 h-48 sm:h-72 w-48 sm:w-72 rounded-full bg-white/25 blur-3xl" />
              <div className="absolute -bottom-16 sm:-bottom-24 -left-10 sm:-left-16 h-56 sm:h-80 w-56 sm:w-80 rounded-full bg-white/20 blur-3xl" />
            </div>
            <div className="container relative py-8 sm:py-12 md:py-16 px-4 sm:px-6">
              <div className="grid gap-6 sm:gap-8 md:gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
                <div className="max-w-2xl">
                  <div className="flex justify-center sm:justify-start">
                    <div className="inline-flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2 md:gap-3 rounded-full border border-white/60 bg-white/90 text-primary px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-bold sm:font-extrabold tracking-wide shadow-[0_8px_30px_rgba(255,255,255,0.4)] sm:shadow-[0_12px_40px_rgba(255,255,255,0.5)]">
                      <span className="whitespace-nowrap">✓ Global languages grammar check</span>
                      <span className="whitespace-nowrap">✓ Grammarly alternative</span>
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mt-4 sm:mt-5 tracking-tight px-2 sm:px-0">
                    CorrectNow – An AI proofreader and grammar checker for multiple languages
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl mt-3 sm:mt-4 leading-relaxed px-2 sm:px-0">
                    Correct grammar, spelling, and punctuation errors instantly with CorrectNow. 
                    Professional AI-powered writing assistant for flawless content in 50+ languages.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-5 sm:mt-7 px-2 sm:px-0">
                    <Button
                      className="rounded-full bg-white text-primary px-5 sm:px-6 md:px-7 py-4 sm:py-4.5 md:py-5 text-sm sm:text-base font-semibold shadow-[0_8px_20px_rgba(255,255,255,0.2)] sm:shadow-[0_12px_30px_rgba(255,255,255,0.25)] hover:bg-white/95 w-full sm:w-auto"
                      onClick={() => navigate("/editor")}
                    >
                      Check My Text Now - Free
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full border-white/50 bg-transparent text-white px-5 sm:px-6 md:px-7 py-4 sm:py-4.5 md:py-5 text-sm sm:text-base font-semibold hover:bg-white/10 w-full sm:w-auto"
                      onClick={() => navigate("/features")}
                    >
                      See How It Works
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 sm:gap-6 mt-5 sm:mt-7 text-xs sm:text-sm text-white/85 justify-center sm:justify-start px-2 sm:px-0">
                    <span className="inline-flex items-center gap-2">✓ Free forever</span>
                    <span className="inline-flex items-center gap-2">✓ Instant results</span>
                    <span className="inline-flex items-center gap-2">✓ No sign-up required</span>
                  </div>
                  <div className="mt-5 text-xs text-white/75 italic">
                    🔒 Your privacy matters: We don't store or share your text
                  </div>
                </div>

                <Card className="bg-white/95 text-foreground rounded-2xl shadow-[0_20px_60px_rgba(15,30,80,0.3)]">
                  <CardContent className="p-6 md:p-7">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span className="font-semibold">Live preview</span>
                      <span>Professional proofreading</span>
                    </div>

                    <div className="rounded-xl border border-border bg-white p-4">
                      <div className="text-xs font-semibold text-muted-foreground">Original</div>
                      <div className="text-sm text-foreground mt-2">
                        Please <span className="text-red-500 underline">recieve</span> the document and reply when <span className="text-red-500 underline">your</span> done.
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-white p-4 mt-4">
                      <div className="text-xs font-semibold text-muted-foreground">Corrected</div>
                      <div className="text-sm text-foreground mt-2">
                        Please <span className="text-emerald-600 font-semibold">receive</span> the document and reply when <span className="text-emerald-600 font-semibold">you’re</span> done.
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-white p-4 mt-4">
                      <div className="text-xs font-semibold text-muted-foreground">Change log</div>
                      <div className="text-sm text-foreground mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">recieve</span>
                          <span className="font-medium">receive</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">your</span>
                          <span className="font-medium">you’re</span>
                        </div>
                        <div className="text-xs text-muted-foreground pt-1">
                          Explanations included for every fix
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Features Section with SEO Content */}
        {!isAuthenticated && (
        <section className="container pt-16 pb-8 md:pt-20 md:pb-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose CorrectNow Grammar Checker?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The best free alternative to Grammarly for instant grammar and spelling corrections
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Instant Grammar Check</h3>
                <p className="text-muted-foreground">
                  Get real-time grammar, spelling, and punctuation corrections as you type. Fix errors instantly with AI-powered suggestions.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">50+ Languages Supported</h3>
                <p className="text-muted-foreground">
                  Check grammar in English, Spanish, French, German, Tamil, Hindi, and 45+ more languages. Perfect for multilingual content.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">100% Private & Secure</h3>
                <p className="text-muted-foreground">
                  Your text is never stored or shared. We respect your privacy and ensure complete data security.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Free Forever</h3>
                <p className="text-muted-foreground">
                  No credit card required. Start checking your grammar, spelling, and punctuation for free. Upgrade anytime for advanced features.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Smart AI Assistant</h3>
                <p className="text-muted-foreground">
                  Powered by advanced AI to catch complex grammar mistakes, improve sentence structure, and enhance your writing quality.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Works Everywhere</h3>
                <p className="text-muted-foreground">
                  Use on desktop, mobile, or tablet. Check emails, essays, social media posts, and professional documents anywhere.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 sm:mt-8 rounded-2xl border border-border bg-secondary/30 p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              Languages supported for grammar checking
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Grammarly alternative and AI proofreader for English, Mandarin Chinese, Hindi, Spanish, French, Modern Standard Arabic, Bengali, Portuguese, Russian, Indonesian, Urdu, Standard German, Japanese, Marathi, Telugu, Turkish, Tamil, Vietnamese, Korean, Italian, Thai, Gujarati, Kannada, Malayalam, Polish, Dutch, Greek, Ukrainian, Romanian, Swedish, Hungarian, Czech, Arabic dialects, and more.
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground mb-3">Ready to Write Error-Free Content?</h3>
            <p className="text-muted-foreground mb-6">Join thousands of users who trust CorrectNow for professional writing</p>
            <Button 
              variant="accent" 
              size="lg"
              onClick={() => navigate("/editor")}
            >
              Try Free Grammar Checker Now
            </Button>
          </div>
        </section>
        )}

        {/* Testimonials Section */}
        {!isAuthenticated && (
        <section className="container py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users say about CorrectNow
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "CorrectNow helps me write without fear of mistakes. Very easy to use. (English, Hindi)"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Arjun Kumar</div>
                    <div className="text-sm text-muted-foreground">University Student</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "Finally, a grammar checker that understands native languages properly. (Malayalam, Tamil)"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Meera Nair</div>
                    <div className="text-sm text-muted-foreground">Author & Blogger</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "We save time and improve clarity across languages. Highly useful. (English, Marathi)"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                    R
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Rohit Menon</div>
                    <div className="text-sm text-muted-foreground">Senior Editor, Metro News Desk</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 4 */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "My emails and reports sound more professional now. (English, Telugu)"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Anita Sharma</div>
                    <div className="text-sm text-muted-foreground">Operations Manager, NextWave Solutions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 5 */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "Excellent accuracy for research writing. Rating: 10/10. (German, English)"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                    D
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Dr. Lukas Schneider</div>
                    <div className="text-sm text-muted-foreground">Research Fellow, Germany</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 6 */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "CorrectNow understands grammar and context perfectly. Powerful tool. (Tamil, English)"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                    R
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Ramesh Naidu</div>
                    <div className="text-sm text-muted-foreground">Script Writer, Silver Screen Studios</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm font-semibold text-muted-foreground">Documents</div>
              <div className="text-2xl font-semibold text-foreground">Recent docs</div>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No documents found.</div>
          ) : (
            sections.map((section) => (
              <div key={section} className="mb-8">
                <div className="text-sm font-semibold text-muted-foreground mb-3">{section}</div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {filtered
                    .filter((doc) => doc.section === section)
                    .map((doc) => (
                      <div key={doc.id} className="flex justify-end">
                        <Card className="hover:shadow-card transition-shadow w-full">
                          <CardContent className="p-5 min-h-[150px]">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <button
                                  className="text-left text-base font-semibold text-foreground hover:text-primary transition-colors"
                                  onClick={() => openDoc(doc.id)}
                                >
                                  {doc.title}
                                </button>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {doc.preview}
                                </p>
                                <div className="text-xs text-muted-foreground mt-2">{doc.updated}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}

          <div className="mt-12">
            <Card className="border border-border bg-secondary/40">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-foreground">
                    Help us improve CorrectNow
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Share an idea or request a feature — we read every suggestion.
                  </div>
                </div>
                <Button
                  variant="accent"
                  onClick={() => setIsSuggestionOpen(true)}
                >
                  Suggest an improvement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
            </>
          )}
        </>
      )}

      <Dialog open={isSuggestionOpen} onOpenChange={setIsSuggestionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share your suggestion</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Tell us what you want improved..."
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSuggestionOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSubmitSuggestion} disabled={isSubmittingSuggestion}>
              {isSubmittingSuggestion ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Index;
