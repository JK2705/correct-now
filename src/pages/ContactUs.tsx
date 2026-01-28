import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CreditCard, Clock, Shield, Globe, HelpCircle, CheckCircle } from "lucide-react";

const ContactUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/5 py-16 md:py-24">
          <div className="container max-w-4xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-2">
                <Mail className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Contact Us
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                We're here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Intro Text */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <p className="text-lg text-muted-foreground text-center">
              Whether you have a question about CorrectNow, need assistance with your account, or have a billing-related inquiry, please reach out to us using the appropriate contact option below.
            </p>
          </div>
        </section>

        {/* Contact Options */}
        <section className="pb-16 md:pb-20">
          <div className="container max-w-5xl">
            <div className="grid gap-8 md:grid-cols-2">
              {/* General Inquiries */}
              <Card className="border-2 hover:border-accent transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent">
                      <HelpCircle className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-2xl">General Inquiries</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">For questions about:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>CorrectNow features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>Product information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>Partnerships or collaborations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>Media or press inquiries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>General support</span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">Email:</span>
                    </div>
                    <a 
                      href="mailto:info@correctnow.app" 
                      className="text-lg font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      info@correctnow.app
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Billing & Subscriptions */}
              <Card className="border-2 hover:border-accent transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent">
                      <CreditCard className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Billing & Subscriptions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">For questions related to:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>Payments and invoices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>Subscription plans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>Refund requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>Billing errors or duplicate charges</span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">Email:</span>
                    </div>
                    <a 
                      href="mailto:billing@correctnow.app" 
                      className="text-lg font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      billing@correctnow.app
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="py-16 md:py-20 bg-accent/5">
          <div className="container max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Response Time */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                      <Clock className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">Response Time</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>We aim to respond to all inquiries within <strong className="text-foreground">24–48 business hours</strong>.</p>
                  <p className="text-sm">Response times may vary during weekends or public holidays.</p>
                </CardContent>
              </Card>

              {/* Account & Privacy */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                      <Shield className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">Account & Privacy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>If your request involves account access, privacy, or security:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Please contact us from the email address associated with your CorrectNow account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Do not share passwords or sensitive payment details via email</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Global Users */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                      <Globe className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">Global Users</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>CorrectNow serves users worldwide.</p>
                  <p>Our support team handles inquiries in English and responds according to applicable regional laws and policies.</p>
                </CardContent>
              </Card>

              {/* Before You Contact */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                      <HelpCircle className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">Before You Contact Us</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>You may find quick answers in:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Help articles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Subscription & billing information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Privacy Policy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Terms of Service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>Refund Policy</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-16 md:py-24 border-t border-border">
          <div className="container max-w-3xl text-center">
            <div className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-bold text-foreground mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent">
                <CheckCircle className="w-6 h-6 text-accent-foreground" />
              </div>
              <span>CorrectNow</span>
            </div>
            <p className="text-lg text-muted-foreground">
              Write clearly. Communicate confidently.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
