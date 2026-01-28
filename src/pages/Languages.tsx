import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Languages = () => {
  const [rawText, setRawText] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/languages.txt");
        const text = await res.text();
        setRawText(text || "");
      } catch {
        setRawText("");
      }
    };
    load();
  }, []);

  const languages = useMemo(() => {
    const tokens = rawText
      .split(/\n|,/)
      .map((item) => item.replace(/^[^A-Za-z0-9]+/g, "").trim())
      .map((item) => item.replace(/\.$/, "").trim())
      .filter((item) => item && !/(spoken languages|major global|indian & south asian|east & southeast asian|middle eastern|european|african|americas|pacific & australian)/i.test(item));

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of tokens) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }
    return unique;
  }, [rawText]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="container max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-xs font-semibold text-muted-foreground">
              Grammarly alternative • AI proofreader
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-3">
              Languages supported for grammar checking
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto">
              Grammarly alternative and AI proofreader for English, Mandarin Chinese, Hindi, Spanish, French, Modern Standard Arabic, Bengali, Portuguese, Russian, Indonesian, Urdu, Standard German, Japanese, Marathi, Telugu, Turkish, Tamil, Vietnamese, Korean, Italian, Thai, Gujarati, Kannada, Malayalam, Polish, Dutch, Greek, Ukrainian, Romanian, Swedish, Hungarian, Czech, Arabic dialects, and more.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex flex-wrap gap-2 md:gap-3">
              {languages.map((language) => (
                <span
                  key={language}
                  className="px-3 py-1.5 rounded-full border border-border bg-secondary/40 text-sm text-foreground hover:bg-accent/10 transition-colors"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Proofread essays, emails, and documents in 100+ languages with CorrectNow.
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Languages;
