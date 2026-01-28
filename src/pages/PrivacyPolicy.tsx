import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/5 py-16 md:py-24">
          <div className="container max-w-4xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-2">
                <Shield className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Welcome to CorrectNow.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container max-w-4xl space-y-6">
            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <p className="text-muted-foreground text-lg">
                  CorrectNow is an AI-powered proofreading and writing assistance platform designed to help people communicate more clearly and confidently. When you use CorrectNow, you trust us with your personal data and your writing. We take that trust seriously.
                </p>
                <p className="text-muted-foreground text-lg">
                  We generate revenue by offering paid subscriptions to our products. We do not sell, rent, or trade user content or personal data. You own what you write.
                </p>
                <p className="text-muted-foreground text-lg">
                  This Privacy Policy explains how CorrectNow Technologies (“CorrectNow,” “we,” “us,” or “our”) collects, uses, stores, and shares information when you use our products, websites, and services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">When This Privacy Policy Applies</h2>
                <p className="text-muted-foreground text-lg">This Privacy Policy applies when:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>You create an individual account with CorrectNow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>You use CorrectNow’s free or paid products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>You visit our websites or mobile applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>You interact with our customer support, sales, or marketing communications</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  Unless stated otherwise, this policy applies to all CorrectNow products, including browser extensions, desktop apps, mobile apps, web editors, and APIs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">When This Privacy Policy Does Not Apply</h2>
                <p className="text-muted-foreground text-lg">
                  If you use CorrectNow through an organization, company, school, or institution (for example, CorrectNow for Teams or CorrectNow for Education), your organization controls your account and data.
                </p>
                <p className="text-muted-foreground text-lg">In those cases:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>We process user content on behalf of the organization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Data handling is governed by our contract with that organization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>This Privacy Policy does not apply to organization-managed user content</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  Please contact your organization’s administrator for privacy-related requests.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">How We Make Money</h2>
                <p className="text-muted-foreground text-lg">CorrectNow offers both free and paid plans.</p>
                <p className="text-muted-foreground text-lg">We make money only from subscription fees.</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>We do not sell user data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>We do not monetize user content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>We do not use user content for advertising</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Information We Collect</h2>
                <p className="text-muted-foreground text-lg">
                  The information we collect depends on how you use CorrectNow and your settings.
                </p>
                <h3 className="text-xl font-semibold text-foreground">1. Information You Provide</h3>
                <p className="text-muted-foreground text-lg font-semibold">Account Information</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Name</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Email address</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Password</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Language preferences</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Organization name (if applicable)</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  If you sign up using third-party authentication (such as Google or Apple), we collect only the information you authorize.
                </p>
                <p className="text-muted-foreground text-lg font-semibold">Payment Information</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Subscription status</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Transaction history</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  Payment card details are processed securely by third-party payment providers (such as Stripe or Razorpay). We do not store full card details.
                </p>
                <p className="text-muted-foreground text-lg font-semibold">User Content</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Text you write, paste, or upload for proofreading</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Documents, drafts, or messages you choose to analyze</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  We process this content only to provide writing assistance.
                </p>
                <p className="text-muted-foreground text-lg font-semibold">Communications</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Messages you send to our support team</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Feedback, survey responses, or feature requests</span></li>
                </ul>
                <h3 className="text-xl font-semibold text-foreground pt-4">2. Information We Collect Automatically</h3>
                <p className="text-muted-foreground text-lg font-semibold">Technical Information</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>IP address</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Device type</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Browser type and version</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Operating system</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Time zone and approximate location</span></li>
                </ul>
                <p className="text-muted-foreground text-lg font-semibold">Usage Data</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Features you use</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Interaction logs</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Performance and error logs</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Session duration and frequency</span></li>
                </ul>
                <p className="text-muted-foreground text-lg font-semibold">Cookies and Similar Technologies</p>
                <p className="text-muted-foreground text-lg">We use cookies and similar technologies to:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Maintain sessions</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Improve performance</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Analyze usage</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Support marketing preferences</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">You can control cookies through your browser settings.</p>
                <h3 className="text-xl font-semibold text-foreground pt-4">3. Information About Non-Users</h3>
                <p className="text-muted-foreground text-lg">
                  Your content may include information about people who do not use CorrectNow (for example, recipients of emails or documents).
                </p>
                <p className="text-muted-foreground text-lg">
                  We use such information only to provide our services to you and never to contact or market to non-users.
                </p>
                <h3 className="text-xl font-semibold text-foreground pt-4">4. Information From Other Sources</h3>
                <p className="text-muted-foreground text-lg">We may receive limited information from:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Authentication providers</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Payment processors</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Analytics services</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  This information is combined with other data only to improve our services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">How We Use Information</h2>
                <p className="text-muted-foreground text-lg">We use information to:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Provide and personalize our products</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Deliver grammar, clarity, and tone suggestions</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Improve product performance and reliability</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Develop and improve AI models (subject to user controls)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Process payments and manage subscriptions</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Communicate with you about updates and support</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Secure our systems and prevent fraud</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Comply with legal obligations</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">We do not use user content for advertising.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">AI Training and User Control</h2>
                <p className="text-muted-foreground text-lg">
                  CorrectNow may use anonymized or de-identified data to improve our AI systems.
                </p>
                <p className="text-muted-foreground text-lg">Where applicable, users can control:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Whether their content is used for AI improvement</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Personalization settings</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  We never allow third-party AI providers to train their models on identifiable user content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">When We Share Information</h2>
                <p className="text-muted-foreground text-lg">We may share information only in the following situations:</p>
                <p className="text-muted-foreground text-lg font-semibold">1. Service Providers</p>
                <p className="text-muted-foreground text-lg">We work with trusted providers for:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Cloud hosting</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Payment processing</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Analytics</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Security monitoring</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  These providers are bound by strict confidentiality and data protection agreements.
                </p>
                <p className="text-muted-foreground text-lg font-semibold pt-2">2. Legal and Regulatory Authorities</p>
                <p className="text-muted-foreground text-lg">We may disclose information if required to:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Comply with laws or regulations</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Respond to legal requests</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Protect user safety or prevent fraud</span></li>
                </ul>
                <p className="text-muted-foreground text-lg font-semibold pt-2">3. Business Transfers</p>
                <p className="text-muted-foreground text-lg">
                  If CorrectNow is involved in a merger, acquisition, or sale, user information may be transferred as part of that transaction, subject to legal protections.
                </p>
                <p className="text-muted-foreground text-lg font-semibold pt-2">4. With Your Consent</p>
                <p className="text-muted-foreground text-lg">
                  We may share information if you explicitly authorize us to do so.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Data Security and Retention</h2>
                <p className="text-muted-foreground text-lg">We use industry-standard safeguards, including:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Encryption</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Access controls</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Secure infrastructure</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Regular security reviews</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  We retain personal data only as long as necessary to:
                </p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Provide our services</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Meet legal obligations</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Resolve disputes</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  User content is retained according to product functionality and user settings and may be deleted or anonymized.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Your Rights and Choices</h2>
                <p className="text-muted-foreground text-lg">Depending on your location, you may have the right to:</p>
                <ul className="space-y-2 text-muted-foreground text-lg">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Access your personal data</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Correct inaccurate data</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Delete your data</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Restrict or object to processing</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Export your data</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span>Withdraw consent</span></li>
                </ul>
                <p className="text-muted-foreground text-lg">
                  You can manage many of these rights through your account settings or by contacting us.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">International Data Transfers</h2>
                <p className="text-muted-foreground text-lg">
                  CorrectNow operates globally. Your data may be processed outside your country.
                </p>
                <p className="text-muted-foreground text-lg">
                  We use appropriate safeguards, including contractual protections, to ensure lawful data transfers in accordance with applicable laws.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Children’s Privacy</h2>
                <p className="text-muted-foreground text-lg">
                  CorrectNow is not intended for children under 13 (or the minimum age required by law in your country). We do not knowingly collect data from children.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Changes to This Policy</h2>
                <p className="text-muted-foreground text-lg">We may update this Privacy Policy from time to time.</p>
                <p className="text-muted-foreground text-lg">
                  If changes are material, we will notify you via email or within the product.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Contact Information</h2>
                <p className="text-muted-foreground text-lg">If you have questions about this Privacy Policy or your data, contact us at:</p>
                <p className="text-muted-foreground text-lg">Email: info@correctnow.app</p>
                <p className="text-muted-foreground text-lg">Company: CorrectNow Technologies</p>
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground pt-2">
                  <Mail className="w-5 h-5 text-accent" />
                  <span>info@correctnow.app</span>
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

export default PrivacyPolicy;
