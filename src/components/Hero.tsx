import { useEffect, useState } from "react";
import { ArrowRight, Check, Globe, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (current) => {
      setIsAuthenticated(Boolean(current));
    });
    return () => unsub();
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative gradient-hero overflow-hidden">
      {/* Subtle pattern + light bloom (professional, not flashy) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3.25rem_3.25rem]" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/10" />

      <div className="container relative z-10 py-28 md:py-36 lg:py-40">
        <div className="flex justify-center lg:justify-start mb-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-white text-primary px-6 py-3 text-sm sm:text-base font-bold shadow-[0_12px_40px_rgba(255,255,255,0.45)] border border-white/60">
              <Sparkles className="w-4 h-4" />
              <span>✓ Global languages grammar check</span>
              <span className="text-primary/40">•</span>
              <span>✓ Grammarly alternative</span>
              <span className="text-primary/40">•</span>
              <span>✓ AI-powered</span>
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: copy + CTAs */}
          <div className="text-center lg:text-left">

            <h1 className="animate-slide-up text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.06] tracking-tight text-white">
              Write with confidence.
              <span className="block mt-2">Proofread instantly.</span>
            </h1>

            <p className="animate-slide-up mt-6 text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              CorrectNow fixes spelling mistakes and grammar issues across global languages
              (including Hindi, Tamil, and Bengali) — without rewriting your tone.
            </p>

            <div className="animate-slide-up mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="hero"
                onClick={onGetStarted}
                size="lg"
                className="h-14 text-lg font-semibold shadow-2xl hover:shadow-white/15"
              >
                Start Free Check
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="hero-outline"
                onClick={scrollToFeatures}
                size="lg"
                className="h-14 text-lg"
              >
                See How It Works
              </Button>
            </div>

            {!isAuthenticated && (
              <div className="animate-fade-in mt-4 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="h-12 text-base bg-white/90 hover:bg-white">
                    Login
                  </Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button variant="accent" size="lg" className="h-12 text-base">
                    Register
                  </Button>
                </Link>
              </div>
            )}

          </div>

          {/* Right: benefits + live preview */}
          <div className="relative space-y-6">
            <div className="absolute -inset-4 rounded-3xl bg-white/10 blur-2xl" />
            <div className="relative rounded-2xl border border-white/40 bg-white/20 backdrop-blur-md p-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              <div className="text-sm font-bold uppercase tracking-wide text-white/80 mb-3">
                Why CorrectNow
              </div>
              <ul className="space-y-3 text-base font-semibold">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Correct all global languages
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Grammerly alternative
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  More to improve
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Trusted by professionals worldwide
                </li>
              </ul>
            </div>

            <div className="flex justify-end">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs md:text-sm font-semibold text-foreground shadow-sm ring-1 ring-primary/20">
                <span className="inline-flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Global languages grammar check
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="inline-flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Grammarly alternative
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI-powered
                </span>
              </div>
            </div>

            <div className="relative rounded-2xl bg-white border border-white/30 shadow-elevated p-6 md:p-7">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="text-sm font-semibold text-foreground">Live preview</div>
                <div className="text-xs text-muted-foreground">Professional proofreading</div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Original</div>
                  <p className="text-sm md:text-base text-foreground leading-relaxed">
                    Please <span className="underline decoration-warning decoration-2 underline-offset-2">recieve</span> the document and
                    reply when <span className="underline decoration-warning decoration-2 underline-offset-2">your</span> done.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Corrected</div>
                  <p className="text-sm md:text-base text-foreground leading-relaxed">
                    Please <span className="font-semibold text-success">receive</span> the document and reply when <span className="font-semibold text-success">you’re</span> done.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-3">Change log</div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                    <span className="text-muted-foreground">recieve</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">receive</span>

                    <span className="text-muted-foreground">your</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">you’re</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3.5 h-3.5" />
                    Explanations included for every fix
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
