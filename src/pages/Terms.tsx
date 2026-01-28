import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, CheckCircle, Mail } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/5 py-16 md:py-24">
          <div className="container max-w-4xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-2">
                <Scale className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Terms of Service
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Effective Date: March 28, 2026 • Last Updated: March 28, 2026
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container max-w-4xl space-y-6">
            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  These Terms of Service ("Terms") form a legally binding agreement between CorrectNow Technologies
                  ("CorrectNow," "we," "us," or "our") and you ("you" or "your"). These Terms govern your access
                  to and use of CorrectNow’s websites, applications, browser extensions, APIs, software, and related
                  services (collectively, the "Services").
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  IMPORTANT NOTICE ABOUT DISPUTE RESOLUTION: Please read Section 12 carefully. It contains an
                  arbitration agreement, class‑action waiver, and jury‑trial waiver that affect your legal rights.
                  Unless prohibited by local law, disputes must be resolved through binding individual arbitration,
                  not courts.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-6">
                <h2 className="text-2xl font-bold text-foreground">1. Acceptance of These Terms</h2>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>You have read and understood these Terms.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>You agree to be bound by them.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>You are legally permitted to use the Services.</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">If you do not agree, do not use the Services.</p>

                <h2 className="text-2xl font-bold text-foreground">2. Changes to These Terms</h2>
                <p className="text-muted-foreground text-lg">We may update these Terms from time to time. Material changes will be notified at least 30 days in advance. Continued use constitutes acceptance.</p>

                <h2 className="text-2xl font-bold text-foreground">3. Use of the Services</h2>
                <p className="text-muted-foreground text-lg">We grant a limited, non‑exclusive, non‑transferable, revocable license to use the Services for lawful purposes.</p>
                <p className="text-muted-foreground text-lg">You must be at least 13 years old (or older if required by local law). In certain jurisdictions (e.g., EU), you must be at least 16.</p>
                <p className="text-muted-foreground text-lg">You are responsible for keeping credentials secure and all activity under your account.</p>

                <h3 className="text-xl font-semibold text-foreground">Prohibited Uses</h3>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li>Reverse engineer or attempt to extract source code.</li>
                  <li>Resell, sublicense, or commercially exploit the Services.</li>
                  <li>Circumvent technical limitations.</li>
                  <li>Use the Services for illegal, harmful, or abusive purposes.</li>
                  <li>Train competing AI models using the Services.</li>
                  <li>Upload content that violates laws or third‑party rights.</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground">4. AI‑Powered Features</h2>
                <p className="text-muted-foreground text-lg">Outputs may be inaccurate or incomplete and are provided “as is.” You are responsible for how you use Outputs.</p>
                <p className="text-muted-foreground text-lg">CorrectNow does not provide legal, academic, medical, or professional advice.</p>

                <h2 className="text-2xl font-bold text-foreground">5. Integrations & Third‑Party Services</h2>
                <p className="text-muted-foreground text-lg">Third‑party terms govern your use of their services. We are not responsible for them.</p>

                <h2 className="text-2xl font-bold text-foreground">6. Beta Features</h2>
                <p className="text-muted-foreground text-lg">Beta features may be unstable, are provided without warranties, and may be modified or removed.</p>

                <h2 className="text-2xl font-bold text-foreground">7. User Content</h2>
                <p className="text-muted-foreground text-lg">You retain ownership of your content. You grant us a limited license to process content solely to provide and improve the Services.</p>

                <h2 className="text-2xl font-bold text-foreground">8. Subscriptions, Billing & Payments</h2>
                <p className="text-muted-foreground text-lg">Paid subscriptions renew automatically unless canceled. Payments are processed by third‑party providers (e.g., Razorpay). We do not store full payment card details. Fees are non‑refundable where permitted by law.</p>

                <h2 className="text-2xl font-bold text-foreground">9. Suspension & Termination</h2>
                <p className="text-muted-foreground text-lg">We may suspend or terminate accounts for violations or legal requirements. Access ends immediately upon termination.</p>

                <h2 className="text-2xl font-bold text-foreground">10. Disclaimers</h2>
                <p className="text-muted-foreground text-lg">Services are provided “as is” and “as available” without warranties.</p>

                <h2 className="text-2xl font-bold text-foreground">11. Limitation of Liability</h2>
                <p className="text-muted-foreground text-lg">Liability is limited to fees paid in the last 12 months, or USD $100 for free plans where applicable.</p>

                <h2 className="text-2xl font-bold text-foreground">12. Arbitration & Dispute Resolution</h2>
                <p className="text-muted-foreground text-lg">Disputes are resolved by binding individual arbitration where allowed. Class actions are waived.</p>

                <h2 className="text-2xl font-bold text-foreground">13. Intellectual Property</h2>
                <p className="text-muted-foreground text-lg">All platform IP belongs to CorrectNow. Branding use requires permission.</p>

                <h2 className="text-2xl font-bold text-foreground">14. Mobile Applications</h2>
                <p className="text-muted-foreground text-lg">Mobile apps are subject to Apple App Store and Google Play terms.</p>

                <h2 className="text-2xl font-bold text-foreground">15. Force Majeure</h2>
                <p className="text-muted-foreground text-lg">We are not liable for delays or failures beyond reasonable control.</p>

                <h2 className="text-2xl font-bold text-foreground">16. Severability & Entire Agreement</h2>
                <p className="text-muted-foreground text-lg">If any provision is unenforceable, the rest remain valid. These Terms are the entire agreement.</p>

                <h2 className="text-2xl font-bold text-foreground">17. Contact Information</h2>
                <div className="flex items-start gap-3 text-muted-foreground text-lg">
                  <Mail className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <div>info@correctnow.app</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
