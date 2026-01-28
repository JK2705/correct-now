import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { doc as firestoreDoc, onSnapshot } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [planName, setPlanName] = useState<"Free" | "Pro">("Free");
  const [credits, setCredits] = useState(0);
  const [wordLimit, setWordLimit] = useState(200);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [creditsUsed, setCreditsUsed] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const db = getFirebaseDb();
    const unsub = onAuthStateChanged(auth, async (current) => {
      setIsAuthenticated(Boolean(current));
      if (!current) {
        setUserName("");
        setUserEmail("");
        setPlanName("Free");
        setCredits(0);
        setWordLimit(200);
        setSubscriptionStatus("");
        setCreditsUsed(0);
        return;
      }
      setUserName(current.displayName || "User");
      setUserEmail(current.email || "");
      if (db) {
        const ref = firestoreDoc(db, `users/${current.uid}`);
        onSnapshot(ref, (snap) => {
          const data = snap.exists() ? snap.data() : {};
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
          const plan = (hasStatus ? isActive && entitlementPlan : entitlementPlan) ? "Pro" : "Free";
          const planCredits = Number(data?.credits || (plan === "Pro" ? 50000 : 0));
          const addonCredits = Number(data?.addonCredits || 0);
          const addonExpiry = data?.addonCreditsExpiryAt
            ? new Date(String(data.addonCreditsExpiryAt))
            : null;
          const addonValid = addonExpiry ? addonExpiry.getTime() > Date.now() : false;
          const totalCredits = planCredits + (addonValid ? addonCredits : 0);
          setPlanName(plan);
          setCredits(totalCredits);
          setWordLimit(Number(data?.wordLimit || (plan === "Pro" ? 5000 : 200)));
          setSubscriptionStatus(String(data?.subscriptionStatus || ""));
          
          // Check if credits should reset (monthly billing cycle)
          const lastResetDate = data?.creditsResetDate
            ? new Date(String(data.creditsResetDate))
            : data?.subscriptionUpdatedAt
            ? new Date(String(data.subscriptionUpdatedAt))
            : data?.creditsUpdatedAt
            ? new Date(String(data.creditsUpdatedAt))
            : null;
          const now = new Date();
          const shouldReset =
            plan === "Pro" &&
            isActive &&
            Boolean(lastResetDate) &&
            now.getTime() - lastResetDate.getTime() > 30 * 24 * 60 * 60 * 1000;

          if (shouldReset) {
            // Reset usage for new billing cycle
            setCreditsUsed(0);
          } else {
            const usedValue = Number(data?.creditsUsed || 0);
            setCreditsUsed(usedValue);
          }
        });
      }
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-none px-3 sm:px-4 md:px-0">
        <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] md:items-center gap-2 sm:gap-3 py-2 sm:py-4">
          <div className="flex w-full md:w-auto items-center justify-center md:justify-start md:pl-6">
            <Link to="/" className="flex items-center">
              <img
                src="/Icon/correctnow logo final2.png"
                alt="CorrectNow"
                className="brand-logo"
                loading="eager"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center justify-center gap-4 lg:gap-6">
            <Link
              to="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              to="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/languages"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Languages
            </Link>
          </nav>

          <div className="flex w-full md:w-auto items-center justify-center md:justify-end gap-2">
            {!isAuthenticated && (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button variant="accent" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            {isAuthenticated && location.pathname !== "/dashboard" && location.pathname !== "/" && (
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>

        <nav className="flex md:hidden items-center justify-center gap-3 overflow-x-auto scrollbar-hide pb-2 -mt-1">
          <Link
            to="/about"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            About Us
          </Link>
          <Link
            to="/features"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Features
          </Link>
          <Link
            to="/blog"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Blog
          </Link>
          <Link
            to="/pricing"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Pricing
          </Link>
          <Link
            to="/languages"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Languages
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
