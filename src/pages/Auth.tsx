import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { writeSessionId } from "@/lib/session";
import { doc as firestoreDoc, setDoc, getDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showGoogleNameDialog, setShowGoogleNameDialog] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    setIsLogin(mode !== "register");
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error("Firebase is not configured yet.");
        return;
      }

      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
          await auth.signOut();
          toast.error("Please verify your email before signing in. Check your inbox for the verification link.");
          return;
        }
        const db = getFirebaseDb();
        if (db) {
          const ref = firestoreDoc(db, `users/${result.user.uid}`);
          const existing = await getDoc(ref);
          if (existing.exists() && existing.data()?.status === "deactivated") {
            await auth.signOut();
            toast.error("Your account is deactivated. Contact support to reactivate.");
            return;
          }
          await setDoc(
            ref,
            {
              uid: result.user.uid,
              name: result.user.displayName || "",
              email: result.user.email || "",
              status: "active",
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          await writeSessionId(result.user, true);
        }
        toast.success("Signed in successfully");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(result.user, { displayName: name.trim() });
        }
        const verifyRes = await fetch(`${apiBase}/api/auth/send-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: result.user.email,
            continueUrl: window.location.origin,
          }),
        });
        if (!verifyRes.ok) {
          throw new Error("Failed to send verification email");
        }
        
        // Sign out the user to prevent auto-login before verification
        await auth.signOut();
        
        // Show dialog to inform user about email verification
        alert("Account created successfully! Please check your email to verify your account before signing in.");
        
        // Reset form and redirect to login
        setEmail("");
        setPassword("");
        setName("");
        setIsLogin(true);
        navigate("/auth?mode=login");
        return;
      }

      navigate("/");
    } catch (error: any) {
      toast.error(error?.message ?? "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error("Firebase is not configured yet.");
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const db = getFirebaseDb();
      
      if (db) {
        const ref = firestoreDoc(db, `users/${result.user.uid}`);
        const userDoc = await getDoc(ref);

        if (userDoc.exists() && userDoc.data()?.status === "deactivated") {
          await auth.signOut();
          toast.error("Your account is deactivated. Contact support to reactivate.");
          return;
        }
        
        // Check if user exists and has a name
        if (!userDoc.exists() || !userDoc.data()?.name) {
          // New user or user without name - prompt for name
          setGoogleUserData(result.user);
          setGoogleName(result.user.displayName || "");
          setShowGoogleNameDialog(true);
          setIsLoading(false);
          return;
        }
        
        // Existing user with name - just update timestamp
        await setDoc(
          ref,
          {
            uid: result.user.uid,
            name: userDoc.data()?.name || result.user.displayName || "",
            email: result.user.email || "",
            status: "active",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        await writeSessionId(result.user, true);
      }
      toast.success("Signed in with Google");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.message ?? "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoogleName = async () => {
    if (!googleName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    setIsLoading(true);
    try {
      const db = getFirebaseDb();
      if (db && googleUserData) {
        const ref = firestoreDoc(db, `users/${googleUserData.uid}`);
        await setDoc(
          ref,
          {
            uid: googleUserData.uid,
            name: googleName.trim(),
            email: googleUserData.email || "",
            status: "active",
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
        
        // Update Firebase Auth profile
        await updateProfile(googleUserData, { displayName: googleName.trim() });
      }
      
      setShowGoogleNameDialog(false);
      await writeSessionId(googleUserData, true);
      toast.success("Signed in with Google");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save name");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent via-accent/90 to-primary/20 p-8 xl:p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 text-accent-foreground">
            <img 
              src="/Icon/correctnow logo final2.png" 
              alt="CorrectNow"
              className="brand-logo"
            />
          </Link>
        </div>
        
        <div className="space-y-4 lg:space-y-6">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-accent-foreground">
            Perfect your writing with AI-powered proofreading
          </h1>
          <p className="text-accent-foreground/80 text-base lg:text-lg">
            Join thousands of writers who trust CorrectNow for fast, accurate spelling and grammar corrections.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-accent-foreground/90">
              <CheckCircle className="w-5 h-5" />
              <span>Instant corrections in global languages</span>
            </div>
            <div className="flex items-center gap-3 text-accent-foreground/90">
              <CheckCircle className="w-5 h-5" />
              <span>Preserves your original tone and style</span>
            </div>
            <div className="flex items-center gap-3 text-accent-foreground/90">
              <CheckCircle className="w-5 h-5" />
              <span>Detailed explanations for every change</span>
            </div>
          </div>
        </div>

        <p className="text-accent-foreground/60 text-sm">
          Â© 2024 CorrectNow. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="lg:hidden flex flex-col items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/Icon/correctnow logo final2.png" 
                alt="CorrectNow"
                className="brand-logo"
              />
            </Link>
            <Link to="/" className="flex items-center gap-2 text-foreground text-xs sm:text-sm">
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Back to home</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Start your journey to perfect writing"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="text-sm text-accent hover:text-accent/80"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <span>{isLogin ? "Sign in" : "Create account"}</span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent hover:text-accent/80 font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Google Name Dialog */}
      <Dialog open={showGoogleNameDialog} onOpenChange={setShowGoogleNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to CorrectNow!</DialogTitle>
            <DialogDescription>
              Please tell us your name to complete your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="google-name">Full Name</Label>
              <Input
                id="google-name"
                type="text"
                placeholder="Enter your name"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && googleName.trim()) {
                    handleSaveGoogleName();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveGoogleName}
              disabled={isLoading || !googleName.trim()}
            >
              {isLoading ? "Saving..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
