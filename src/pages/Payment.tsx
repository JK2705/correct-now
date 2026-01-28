import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle,
  CreditCard,
  Shield,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { doc as firestoreDoc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { detectCountryCode, formatPrice, getCreditPacks, resolvePricing, type CreditPackKey, type RegionalPricing } from "@/lib/pricing";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardProvider, setCardProvider] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"Free" | "Pro">("Free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [selectedCreditPack, setSelectedCreditPack] = useState<CreditPackKey>("basic");
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState<number | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [regionalPricing, setRegionalPricing] = useState<RegionalPricing>(() =>
    resolvePricing("")
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const isCreditPurchase = searchParams.get("mode") === "credits";
  const creditPacks = useMemo(() => getCreditPacks(regionalPricing.currency), [regionalPricing.currency]);
  const creditPack = useMemo(
    () => creditPacks.find((pack) => pack.key === selectedCreditPack) ?? creditPacks[0],
    [creditPacks, selectedCreditPack]
  );
  const canBuyCredits = true;

  const baseProAmount = Number(regionalPricing.amount || 0);
  const discountPercent = couponPercent ?? 0;
  const discountedProAmount = discountPercent
    ? Math.max(1, Number((baseProAmount * (1 - discountPercent / 100)).toFixed(2)))
    : baseProAmount;
  const discountedProLabel = formatPrice(regionalPricing.currency, discountedProAmount);

  useEffect(() => {
    const loadRegion = async () => {
      const code = await detectCountryCode();
      const pricing = resolvePricing(code);
      setRegionalPricing(pricing);
      if (pricing.useRazorpay) {
        setPaymentMethod("card");
        setCardProvider("razorpay");
      } else {
        setPaymentMethod("card");
        setCardProvider("stripe");
      }
    };
    loadRegion();
  }, []);

  useEffect(() => {
    if (isCreditPurchase) {
      setCouponCode("");
      setCouponPercent(null);
      setCouponError("");
    }
  }, [isCreditPurchase]);

  const handleApplyCoupon = async () => {
    if (isCreditPurchase) {
      setCouponError("Coupons apply only to Pro subscriptions.");
      return;
    }
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    setIsApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch(`${apiBase}/api/coupons/validate?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCouponPercent(null);
        setCouponError(err?.message || "Invalid coupon code.");
        return;
      }
      const data = await res.json();
      const percent = Number(data?.percent || 0);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        setCouponPercent(null);
        setCouponError("Invalid coupon percentage.");
        return;
      }
      setCouponPercent(percent);
      setCouponCode(String(data?.code || code));
      setCouponError("");
    } catch (error) {
      console.error("Coupon validation error:", error);
      setCouponPercent(null);
      setCouponError("Unable to validate coupon. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const proPriceLabel = useMemo(
    () => formatPrice(regionalPricing.currency, regionalPricing.amount),
    [regionalPricing]
  );

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) return;

    let snapUnsub: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (snapUnsub) {
        snapUnsub();
        snapUnsub = undefined;
      }
      if (!user) {
        setCurrentPlan("Free");
        setSubscriptionStatus("");
        return;
      }
      const ref = firestoreDoc(db, `users/${user.uid}`);
      snapUnsub = onSnapshot(ref, (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const planField = String(data?.plan || "").toLowerCase();
        const entitlementPlan = Number(data?.wordLimit) >= 2000 || planField === "pro";
        const status = String(data?.subscriptionStatus || "").toLowerCase();
        const updatedAt = data?.subscriptionUpdatedAt
          ? new Date(String(data.subscriptionUpdatedAt))
          : null;
        const isRecent = updatedAt
          ? Date.now() - updatedAt.getTime() <= 1000 * 60 * 60 * 24 * 31
          : false;
        const isActive = status === "active" && (updatedAt ? isRecent : true);
        setCurrentPlan(isActive && entitlementPlan ? "Pro" : "Free");
        setSubscriptionStatus(status);
      });
    });

    return () => {
      if (snapUnsub) snapUnsub();
      unsub();
    };
  }, []);

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      const db = getFirebaseDb();
      
      if (!user) {
        throw new Error("Please sign in to continue");
      }

      // Handle Stripe payment
      if (paymentMethod === "card" && cardProvider === "stripe") {
        const checkoutRes = await fetch(`${apiBase}/api/stripe/create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            userEmail: user.email,
            type: isCreditPurchase ? "credits" : "subscription",
            credits: isCreditPurchase ? creditPack.credits : undefined,
            amount: isCreditPurchase ? creditPack.amount : baseProAmount,
            priceId: !isCreditPurchase ? regionalPricing.stripePriceId : undefined,
            currency: regionalPricing.currency,
            couponCode: !isCreditPurchase && couponPercent ? couponCode : undefined,
            discountPercent: !isCreditPurchase && couponPercent ? couponPercent : undefined,
          }),
        });
        
        if (!checkoutRes.ok) {
          throw new Error("Failed to create Stripe checkout session");
        }
        
        const { url } = await checkoutRes.json();
        window.location.href = url;
        return;
      }

      // Handle Razorpay payment
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load");
      }

      const keyRes = await fetch(`${apiBase}/api/razorpay/key`);
      if (!keyRes.ok) throw new Error("Unable to fetch payment key");
      const { keyId } = await keyRes.json();

      if (isCreditPurchase) {
        if (!user || !db) {
          throw new Error("Please sign in to buy credits");
        }
        if (!canBuyCredits) {
          throw new Error("Credits add-ons are available for active Pro plans only");
        }

        const orderRes = await fetch(`${apiBase}/api/razorpay/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: creditPack.amount, credits: creditPack.credits }),
        });
        if (!orderRes.ok) throw new Error("Unable to create order");
        const order = await orderRes.json();

        const options = {
          key: keyId,
          order_id: order.id,
          name: "CorrectNow",
          description: `${creditPack.credits.toLocaleString()} credits pack`,
          image: "/Icon/correctnow logo final2.png",
          method: paymentMethod === "upi" ? { upi: true } : { card: true, upi: false },
          prefill: {
            name: user?.displayName || "",
            email: user?.email || "",
          },
          theme: { color: "#2563EB" },
          handler: async () => {
            const ref = firestoreDoc(db, `users/${user.uid}`);
            const snap = await getDoc(ref);
            const now = new Date();
            const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const currentAddon = Number(snap.exists() ? snap.data()?.addonCredits : 0) || 0;
            const currentExpiry = snap.exists() ? snap.data()?.addonCreditsExpiryAt : null;
            const isCurrentValid = currentExpiry ? new Date(String(currentExpiry)).getTime() > now.getTime() : false;
            const nextAddon = (isCurrentValid ? currentAddon : 0) + creditPack.credits;
            await setDoc(
              ref,
              {
                addonCredits: nextAddon,
                addonCreditsExpiryAt: expiry.toISOString(),
                creditsUpdatedAt: now.toISOString(),
                updatedAt: now.toISOString(),
              },
              { merge: true }
            );
            toast.success("Credits added successfully");
            navigate("/");
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          toast.error(response?.error?.description || "Payment failed");
        });
        rzp.open();
        return;
      }

      const subscriptionAmount = Number.isFinite(baseProAmount) && baseProAmount > 0
        ? baseProAmount
        : Number(regionalPricing.amount || 0);
      const subRes = await fetch(`${apiBase}/api/razorpay/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalCount: 12,
          period: "monthly",
          interval: 1,
          amount: subscriptionAmount,
          couponCode: couponPercent ? couponCode : undefined,
          discountPercent: couponPercent || undefined,
        }),
      });
      if (!subRes.ok) throw new Error("Unable to create subscription");
      const subscription = await subRes.json();

      const options = {
        key: keyId,
        subscription_id: subscription.id,
        name: "CorrectNow",
        description: "Pro plan subscription",
        image: "/Icon/correctnow logo final2.png",
        method: paymentMethod === "upi" ? { upi: true } : { card: true, upi: false },
        prefill: {
          name: user?.displayName || "",
          email: user?.email || "",
        },
        theme: { color: "#2563EB" },
        handler: async () => {
          if (user && db) {
            const ref = firestoreDoc(db, `users/${user.uid}`);
            await setDoc(
              ref,
              {
                plan: "pro",
                wordLimit: 2000,
                credits: 50000,
                subscriptionId: subscription?.id || "",
                subscriptionStatus: "active",
                subscriptionUpdatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
          toast.success("Payment successful");
          navigate("/");
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast.error(response?.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error?.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container max-w-7xl flex items-center py-3">
          <div className="flex-1 flex items-center min-w-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/Icon/correctnow logo final2.png" 
                alt="CorrectNow"
                className="h-24 w-auto object-contain"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-12 px-4">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pricing
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Payment Form */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isCreditPurchase ? "Buy add-on credits" : "Complete your purchase"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isCreditPurchase
                ? "Add extra credits to keep checking without interruptions"
                : "You're upgrading to the Pro plan"}
            </p>

            {isCreditPurchase && (
              <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Add-on credits are available to all users and expire after 30 days.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Payment Method Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="card"
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === "card"
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <span>Credit/Debit Card</span>
                  </Label>
                  {regionalPricing.useRazorpay && (
                    <Label
                      htmlFor="upi"
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        paymentMethod === "upi"
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem value="upi" id="upi" />
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <span>UPI</span>
                    </Label>
                  )}
                </RadioGroup>
              </div>

              {paymentMethod === "card" ? (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Card Provider</Label>
                  <RadioGroup
                    value={cardProvider}
                    onValueChange={setCardProvider}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="stripe"
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        cardProvider === "stripe"
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem value="stripe" id="stripe" />
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <span>Stripe</span>
                    </Label>
                    <Label
                      htmlFor="razorpay"
                      className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                        cardProvider === "razorpay"
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      } ${!regionalPricing.useRazorpay ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <RadioGroupItem value="razorpay" id="razorpay" disabled={!regionalPricing.useRazorpay} />
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <span>Razorpay</span>
                    </Label>
                  </RadioGroup>
                </div>
              ) : null}

              <Button
                type="submit"
                variant="accent"
                className="w-full h-12 text-base"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  isCreditPurchase
                    ? `Pay ${formatPrice(regionalPricing.currency, creditPack.amount)}`
                    : `Pay ${discountedProLabel}`
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secured by 256-bit SSL encryption</span>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:pl-12">
            <div className="sticky top-8 bg-card rounded-2xl border border-border p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isCreditPurchase
                      ? `${creditPack.label} (${creditPack.credits.toLocaleString()} credits)`
                      : "Pro Plan"}
                  </span>
                  <span className="text-foreground">
                    {isCreditPurchase
                      ? formatPrice(regionalPricing.currency, creditPack.amount)
                      : `${proPriceLabel}/month`}
                  </span>
                </div>
                {!isCreditPurchase && couponPercent ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({couponCode})</span>
                    <span className="text-foreground">- {formatPrice(regionalPricing.currency, baseProAmount - discountedProAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isCreditPurchase ? "One-time purchase" : "Billed monthly"}
                  </span>
                  <span className="text-muted-foreground">
                    {isCreditPurchase ? "Credits valid for 30 days" : "Cancel anytime"}
                  </span>
                </div>
              </div>

              {!isCreditPurchase && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-foreground">Coupon code</Label>
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="SAVE10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                    >
                      {isApplyingCoupon ? "Applying..." : couponPercent ? "Applied" : "Apply"}
                    </Button>
                  </div>
                  {couponError ? (
                    <p className="mt-2 text-xs text-destructive">{couponError}</p>
                  ) : couponPercent ? (
                    <p className="mt-2 text-xs text-success">{couponPercent}% discount applied.</p>
                  ) : null}
                </div>
              )}

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-foreground">Total due today</span>
                  <span className="text-foreground">
                    {isCreditPurchase ? formatPrice(regionalPricing.currency, creditPack.amount) : discountedProLabel}
                  </span>
                </div>
              </div>

              {isCreditPurchase && (
                <div className="mb-6">
                  <h3 className="font-medium text-foreground mb-3">Select Credit Pack</h3>
                  <RadioGroup value={selectedCreditPack} onValueChange={(value: any) => setSelectedCreditPack(value)}>
                    {creditPacks.map((pack) => (
                      <div
                        key={pack.key}
                        className={`flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-accent transition-colors cursor-pointer ${
                          pack.highlight ? "bg-accent/5" : ""
                        }`}
                      >
                        <RadioGroupItem value={pack.key} id={pack.key} />
                        <Label htmlFor={pack.key} className="flex-1 cursor-pointer">
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {pack.label} - {formatPrice(regionalPricing.currency, pack.amount)}
                            {pack.highlight ? (
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">Best Value</span>
                            ) : null}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pack.credits.toLocaleString()} credits
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-foreground mb-2">
                  {isCreditPurchase ? "Credits pack" : "What's included:"}
                </h3>
                <ul className="space-y-2">
                  {(isCreditPurchase
                    ? [
                        `${creditPack.credits.toLocaleString()} credits added`,
                        "Use credits for extra checks",
                        "Credits expire after 30 days",
                      ]
                    : [
                        "5,000 words per check",
                        "50,000 words monthly",
                        "1 word = 1 credit",
                        "Advanced grammar fixes",
                        "Check history (30 days)",
                        "Priority processing",
                      ]
                  ).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="w-4 h-4 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                By confirming your payment, you agree to our{" "}
                <Link to="/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
