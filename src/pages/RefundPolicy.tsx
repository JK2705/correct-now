import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, CheckCircle, Mail } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/5 py-16 md:py-24">
          <div className="container max-w-4xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-2">
                <CreditCard className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Refund Policy
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Thank you for choosing CorrectNow.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container max-w-4xl space-y-6">
            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <p className="text-muted-foreground text-lg">
                  This Refund Policy explains how refunds, cancellations, and billing issues are handled for CorrectNow’s products and subscriptions. Please read it carefully before making a purchase.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">1. General Policy Overview</h2>
                <p className="text-muted-foreground text-lg">CorrectNow offers digital subscription-based services.</p>
                <p className="text-muted-foreground text-lg">As a general rule:</p>
                <p className="text-muted-foreground text-lg">
                  All purchases are final and non-refundable, except where required by applicable law or explicitly stated in this policy.
                </p>
                <p className="text-muted-foreground text-lg">
                  We encourage users to try CorrectNow Free before upgrading to a paid plan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">2. Free Plan Availability</h2>
                <p className="text-muted-foreground text-lg">
                  CorrectNow provides a free version of the Service to allow users to evaluate features before purchasing a paid subscription.
                </p>
                <p className="text-muted-foreground text-lg">
                  The availability of a free plan is intended to help users make informed decisions and reduce the need for refunds.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">3. Subscription Charges &amp; Billing</h2>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Paid subscriptions are billed in advance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Subscriptions automatically renew unless canceled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Charges apply regardless of usage during the billing period</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  Once a billing cycle begins, fees for that cycle are non-refundable.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">4. Cancellation Policy</h2>
                <p className="text-muted-foreground text-lg">
                  You may cancel your subscription at any time through your account settings.
                </p>
                <p className="text-muted-foreground text-lg">After cancellation:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Your paid features remain active until the end of the current billing period</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>No further charges will be applied</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>The subscription will downgrade to the free plan</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  Canceling a subscription does not trigger a refund for the current billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">5. Refund Eligibility (Limited Exceptions)</h2>
                <p className="text-muted-foreground text-lg">Refunds may be considered only in the following situations:</p>
                <h3 className="text-xl font-semibold text-foreground">5.1 Duplicate or Erroneous Charges</h3>
                <p className="text-muted-foreground text-lg">If you were charged:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Multiple times for the same subscription</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Due to a technical or billing error</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  We will investigate and issue a correction or refund where appropriate.
                </p>
                <h3 className="text-xl font-semibold text-foreground pt-2">5.2 Legal or Regulatory Requirement</h3>
                <p className="text-muted-foreground text-lg">
                  If applicable consumer protection laws in your country require a refund, we will comply with those laws.
                </p>
                <p className="text-muted-foreground text-lg">
                  This may apply in certain jurisdictions for first-time purchases or within mandatory cooling-off periods.
                </p>
                <h3 className="text-xl font-semibold text-foreground pt-2">5.3 Service Unavailability</h3>
                <p className="text-muted-foreground text-lg">
                  If a paid service is completely unavailable for an extended period due to a verified technical failure on our side, we may offer:
                </p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>A partial refund, or</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Account credit, at our discretion</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">6. Non-Refundable Situations</h2>
                <p className="text-muted-foreground text-lg">Refunds will not be issued for:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Partial use of a subscription period</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Forgotten cancellations</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Change of mind after purchase</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Dissatisfaction with AI suggestions or outputs</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Lack of usage or perceived value</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Account termination due to policy violations</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  AI-generated content may vary in quality and accuracy, and this does not constitute grounds for a refund.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">7. Third-Party Purchases</h2>
                <p className="text-muted-foreground text-lg">If you purchased CorrectNow through:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Apple App Store</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Google Play Store</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Any third-party marketplace</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  Refunds are subject to that platform’s refund policy, and CorrectNow cannot issue refunds directly in those cases.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">8. Payment Processors</h2>
                <p className="text-muted-foreground text-lg">
                  Payments are processed securely through third-party providers such as Stripe or Razorpay.
                </p>
                <p className="text-muted-foreground text-lg">CorrectNow does not control:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Card issuer decisions</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Bank processing delays</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Exchange rate differences</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  Any disputes related to payment authorization must be resolved with your payment provider.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">9. Abuse &amp; Fraud Prevention</h2>
                <p className="text-muted-foreground text-lg">CorrectNow reserves the right to:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Deny refunds in cases of abuse or repeated refund requests</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Suspend accounts involved in fraudulent activity</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">10. Changes to This Refund Policy</h2>
                <p className="text-muted-foreground text-lg">We may update this Refund Policy from time to time.</p>
                <p className="text-muted-foreground text-lg">
                  Material changes will be communicated via email or within the product.
                </p>
                <p className="text-muted-foreground text-lg">
                  Continued use of the Services after changes take effect constitutes acceptance of the updated policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">11. Contact Us</h2>
                <p className="text-muted-foreground text-lg">If you believe you qualify for a refund under this policy, contact us at:</p>
                <div className="space-y-2 text-muted-foreground text-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-accent" />
                    <span>📧 billing@correctnow.app</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-accent" />
                    <span>📧 info@correctnow.app</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg pt-2">Please include:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Account email</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Payment reference</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Reason for the request</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">FINAL FOUNDER NOTE (Important)</h2>
                <p className="text-muted-foreground text-lg">This Refund Policy is designed to:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Protect CorrectNow from misuse</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Be fair to genuine users</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Comply with global digital product laws</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Pass Stripe, Razorpay, App Store &amp; Play Store checks</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Align with Grammarly-style SaaS practices</span></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
