import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-border bg-background py-12">
      <div className="container max-w-7xl">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          <div className="flex w-full md:w-auto items-center justify-center md:justify-start">
            <img
              src="/Icon/correctnow logo final2.png"
              alt="CorrectNow"
              className="brand-logo"
              loading="lazy"
            />
          </div>

          <nav className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link to="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">
              Disclaimer
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2026 CorrectNow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
