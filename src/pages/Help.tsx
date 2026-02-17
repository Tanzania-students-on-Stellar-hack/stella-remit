import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle, Wallet, Send, ArrowLeftRight, Shield, Globe, Lock } from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    icon: Globe,
    faqs: [
      {
        q: "What is StellarRemit?",
        a: "StellarRemit is a cross-border remittance platform built on the Stellar blockchain testnet. It lets you send, receive, and convert digital assets instantly with minimal fees.",
      },
      {
        q: "Is this real money?",
        a: "No. StellarRemit runs on the Stellar Testnet, so all assets (XLM, USDC, etc.) are test tokens with no real-world value. It's a safe environment to learn how blockchain payments work.",
      },
      {
        q: "How do I create an account?",
        a: 'Sign up with your email and password on the login page. Once logged in, go to the Dashboard and click "Create Wallet" to generate your Stellar address.',
      },
    ],
  },
  {
    title: "Wallet & Funding",
    icon: Wallet,
    faqs: [
      {
        q: "How do I fund my wallet?",
        a: 'On the Dashboard, click the "Fund (Testnet)" button. This requests 10,000 free test XLM from the Stellar Friendbot — you can do this once per account.',
      },
      {
        q: "What is my wallet address?",
        a: "Your wallet address is the long alphanumeric string shown on the Dashboard and Settings page. Share it with others so they can send you payments.",
      },
      {
        q: "Can I lose my funds?",
        a: "Since this is a testnet, there is nothing of real value to lose. However, your account is secured with encryption and row-level security policies.",
      },
    ],
  },
  {
    title: "Sending & Receiving",
    icon: Send,
    faqs: [
      {
        q: "How do I send money?",
        a: 'Navigate to "Send Money," enter the recipient\'s Stellar address or look up their email, specify the amount and an optional memo, then confirm. The transaction settles in 3-5 seconds.',
      },
      {
        q: "How do I receive money?",
        a: 'Go to "Receive" and share your wallet address or QR code with the sender. Once they send, the funds appear in your balance automatically.',
      },
      {
        q: "Are there fees?",
        a: "Stellar network fees are extremely low (fractions of a cent). StellarRemit does not charge additional fees on the testnet.",
      },
    ],
  },
  {
    title: "Convert & Escrow",
    icon: ArrowLeftRight,
    faqs: [
      {
        q: "What is asset conversion?",
        a: "Convert lets you swap between different assets (e.g., XLM ↔ USDC) using simulated exchange rates on the testnet.",
      },
      {
        q: "What is Escrow?",
        a: "Escrow holds funds in a secure account until both parties agree the conditions are met. It protects buyers and sellers in transactions where trust is needed.",
      },
      {
        q: "How does Escrow work step-by-step?",
        a: "1) The sender creates an escrow with a recipient, amount, and deadline. 2) Funds are locked in a temporary Stellar account. 3) Once conditions are met, either party can release the funds. 4) If the deadline passes, the funds return to the sender.",
      },
    ],
  },
  {
    title: "Security & Privacy",
    icon: Lock,
    faqs: [
      {
        q: "How is my data protected?",
        a: "All sensitive data is protected by row-level security policies. Your Stellar private key is encrypted server-side and never exposed to the browser.",
      },
      {
        q: "Can I change my password?",
        a: "Yes — use the password reset flow on the login page. You'll receive a reset link via email.",
      },
    ],
  },
];

const Help = () => (
  <DashboardLayout>
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-accent" />
          Help & FAQ
        </h1>
        <p className="text-muted-foreground mt-1">
          Everything you need to know about using StellarRemit.
        </p>
      </div>

      {sections.map((section) => {
        const SectionIcon = section.icon;
        return (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="font-sans flex items-center gap-2 text-base">
                <SectionIcon className="h-5 w-5 text-accent" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="single" collapsible className="w-full">
                {section.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`${section.title}-${i}`}>
                    <AccordionTrigger className="text-sm text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </DashboardLayout>
);

export default Help;
