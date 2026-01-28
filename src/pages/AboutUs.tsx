import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, Shield, Target, Heart, TrendingUp, Lightbulb, Award, Globe } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/5 py-16 md:py-24">
          <div className="container max-w-4xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-2">
                <CheckCircle className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                About CorrectNow
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Improving lives by improving communication
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-20">
          <div className="container max-w-4xl">
            <Card className="border-2">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                    <Target className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
                    <h3 className="text-2xl font-semibold text-foreground mb-6">
                      To improve lives by improving communication
                    </h3>
                  </div>
                </div>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    Great writing helps people think clearly, work faster, and connect better. At CorrectNow, our mission is to make clear, confident communication accessible to everyone—no matter where they come from or how they write.
                  </p>
                  <p>
                    We believe that when people express themselves better, opportunities grow, ideas travel farther, and outcomes improve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Great Writing Section */}
        <section className="py-16 md:py-20 bg-accent/5">
          <div className="container max-w-4xl">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Great writing gets results</h2>
                  <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                    <p>
                      CorrectNow democratizes high-quality writing support for everyday communication. Whether you're drafting a professional email, preparing an academic assignment, writing content for work, or simply trying to get your message across clearly, CorrectNow helps you write with confidence.
                    </p>
                    <p>
                      Clear communication leads to real results—stronger relationships, better decisions, and greater impact. With the right tools, anyone can communicate effectively, efficiently, and persuasively.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Partner Section */}
        <section className="py-16 md:py-20">
          <div className="container max-w-4xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                <Lightbulb className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Your AI proofreading and writing partner</h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    CorrectNow is an AI-powered proofreading and writing assistant designed to support people wherever they write. From correcting grammar and spelling to improving clarity, tone, and flow, CorrectNow helps you refine your message—from the first draft to the final version.
                  </p>
                  <p>
                    Built for individuals, teams, and organizations, CorrectNow works seamlessly across platforms and devices, helping users focus on what matters most: their ideas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Innovation Section */}
        <section className="py-16 md:py-20 bg-accent/5">
          <div className="container max-w-4xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                <Award className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Innovation powered by responsible AI</h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    Our team combines expertise in linguistics, artificial intelligence, and product design to build writing assistance that feels intuitive and human.
                  </p>
                  <p>
                    CorrectNow uses advanced machine learning, natural language processing (NLP), and generative AI to understand context—not just rules. Our technology is designed to enhance human expression, not replace it, while preserving each user's unique voice and intent.
                  </p>
                  <p>
                    We are committed to building inclusive, unbiased, and responsible AI that supports diverse communication styles and real-world use cases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-16 md:py-20">
          <div className="container max-w-4xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                <Shield className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Security and privacy are core to our product</h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    Words are personal. That's why protecting user data is fundamental to how CorrectNow operates.
                  </p>
                  <p>
                    We never sell or rent user content. Users fully own what they write. CorrectNow is built with security-first principles, enterprise-grade safeguards, and privacy-by-design architecture.
                  </p>
                  <p>
                    Our business is powered by subscriptions—not by exploiting user data—so trust remains at the center of everything we build.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-20 bg-accent/5">
          <div className="container max-w-4xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                <Heart className="w-6 h-6 text-accent-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Our values guide everything we do</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              At CorrectNow, our values shape our product, our culture, and our decisions:
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Clarity</h3>
                  <p className="text-muted-foreground">Communication should be simple and meaningful</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Integrity</h3>
                  <p className="text-muted-foreground">Ethical, transparent technology comes first</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Empathy</h3>
                  <p className="text-muted-foreground">Writing is human, not mechanical</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Excellence</h3>
                  <p className="text-muted-foreground">Quality matters, down to the smallest detail</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Progress</h3>
                  <p className="text-muted-foreground">Continuous improvement, for users and for ourselves</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mt-6">
              These values influence every feature we design and every experience we deliver.
            </p>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 md:py-20">
          <div className="container max-w-4xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Built for work, education, and everyday life</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              CorrectNow supports a wide range of use cases:
            </p>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">CorrectNow Free</h3>
                  <p className="text-muted-foreground">Helps users polish everyday writing with essential grammar and clarity checks.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">CorrectNow Pro</h3>
                  <p className="text-muted-foreground">Empowers professionals and creators with advanced rewriting, tone optimization, and productivity tools.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">CorrectNow for Teams & Organizations</h3>
                  <p className="text-muted-foreground">Helps businesses maintain consistency, quality, and efficiency across communication.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">CorrectNow for Education</h3>
                  <p className="text-muted-foreground">Supports students and institutions in developing strong writing and critical thinking skills.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Journey Section */}
        <section className="py-16 md:py-20 bg-accent/5">
          <div className="container max-w-4xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                <Globe className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Our journey</h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    CorrectNow is built with a long-term vision: to become a trusted global platform for clear, confident communication.
                  </p>
                  <p>
                    What started as a simple idea—to make writing better and easier—has grown into an ambitious mission to help people communicate at the speed of their thoughts. As language and technology evolve, so will CorrectNow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 md:py-24 border-t border-border">
          <div className="container max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join us in shaping the future of communication
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We imagine a future where clarity leads every conversation and writing feels effortless, not intimidating. Join us as we build tools that help people express their ideas with confidence and impact.
            </p>
            <div className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-bold text-foreground">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent">
                <CheckCircle className="w-6 h-6 text-accent-foreground" />
              </div>
              <span>CorrectNow</span>
            </div>
            <p className="text-lg text-muted-foreground mt-4">
              Write clearly. Communicate confidently.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
