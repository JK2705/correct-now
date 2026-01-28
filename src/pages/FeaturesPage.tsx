import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Features from "@/components/Features";

const FeaturesPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
