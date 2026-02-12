import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Zap, Shield, Clock, DollarSign, Users } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-accent" />
            <span className="text-xl font-bold font-serif text-foreground">StellarRemit</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?tab=signup">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Powered by Stellar Blockchain
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-serif text-foreground leading-tight mb-6">
            Send Money Across Borders,{" "}
            <span className="text-accent">Instantly</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The modern remittance platform designed for students. Transfer funds internationally
            with near-zero fees, stablecoin support, and blockchain-verified security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8" asChild>
              <Link to="/auth?tab=signup">Open Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-secondary/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold font-serif text-center mb-12">Why Choose StellarRemit?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Instant Transfers", desc: "Transactions settle in 3-5 seconds on the Stellar network. No more waiting days for wire transfers." },
              { icon: DollarSign, title: "Near-Zero Fees", desc: "Send money for fractions of a cent. No hidden charges, no intermediary bank fees." },
              { icon: Shield, title: "Blockchain Security", desc: "Every transaction is cryptographically secured and permanently recorded on the Stellar ledger." },
              { icon: Globe, title: "Global Reach", desc: "Send to any Stellar wallet worldwide. No borders, no restrictions, no banking hours." },
              { icon: Clock, title: "Escrow Protection", desc: "Built-in escrow for secure trades. Funds are held safely until both parties confirm." },
              { icon: Users, title: "Student-Focused", desc: "Designed specifically for international students managing tuition, rent, and living expenses." },
            ].map((f, i) => (
              <div key={i} className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <f.icon className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-lg font-semibold mb-2 font-sans">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold font-serif mb-12">How It Works</h2>
          <div className="space-y-8 text-left">
            {[
              { step: "1", title: "Create Your Account", desc: "Sign up with your email. A Stellar wallet is automatically created for you." },
              { step: "2", title: "Fund Your Wallet", desc: "Add testnet XLM to your wallet using our built-in funding feature." },
              { step: "3", title: "Send Money Globally", desc: "Enter a recipient's address or email, set the amount, and send instantly." },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 font-sans">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-card">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            <span className="font-semibold text-foreground font-serif">StellarRemit</span>
          </div>
          <p>© {new Date().getFullYear()} StellarRemit. Stellar Testnet Demo.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
