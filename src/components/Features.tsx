import { Zap, Globe, Shield, Brain, Clock, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Get corrections in seconds, not minutes. Our AI processes your text instantly.",
  },
  {
    icon: Globe,
    title: "Global Languages",
    description:
      "Full support for Hindi, Tamil, Bengali, and global languages worldwide.",
  },
  {
    icon: Shield,
    title: "Preserves Your Voice",
    description:
      "We fix errors without rewriting. Your original meaning stays intact.",
  },
  {
    icon: Brain,
    title: "Smart Corrections",
    description:
      "AI-powered spelling and grammar fixes — without changing your tone.",
  },
  {
    icon: Clock,
    title: "Real-time Results",
    description:
      "See corrections as they happen with our streaming response system.",
  },
  {
    icon: FileCheck,
    title: "Detailed Explanations",
    description:
      "Learn from your mistakes with clear explanations for each correction.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose CorrectNow?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for speed, accuracy, and simplicity. Perfect your writing
            without changing your style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="shadow-sm hover:shadow-card transition-all duration-300 bg-card"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 shrink-0">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
