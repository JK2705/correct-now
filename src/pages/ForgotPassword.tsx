import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error("Firebase is not configured yet.");
        return;
      }
      const res = await fetch(`${apiBase}/api/auth/send-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, continueUrl: window.location.origin }),
      });
      if (!res.ok) {
        await sendPasswordResetEmail(auth, email);
      }
      setIsSubmitted(true);
      toast.success("Password reset email sent");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <img 
              src="/Icon/correctnow logo final2.png" 
              alt="CorrectNow"
              className="h-24 w-auto object-contain"
            />
          </Link>

          {!isSubmitted ? (
            <>
              <h2 className="text-2xl font-bold text-foreground">
                Forgot your password?
              </h2>
              <p className="mt-2 text-muted-foreground">
                No worries, we'll send you reset instructions.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Check your email
              </h2>
              <p className="mt-2 text-muted-foreground">
                We sent a password reset link to{" "}
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </>
          )}
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button
              type="submit"
              variant="accent"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                "Reset password"
              )}
            </Button>

            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </form>
        ) : (
          <div className="space-y-4">
            <Button
              variant="accent"
              className="w-full"
              onClick={() => window.open("mailto:", "_blank")}
            >
              Open email app
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive the email?{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-accent hover:underline"
              >
                Click to resend
              </button>
            </p>

            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
