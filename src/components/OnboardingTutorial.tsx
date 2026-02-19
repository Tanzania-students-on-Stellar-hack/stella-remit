import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wallet, Send, ArrowRight, CheckCircle, Banknote, Globe } from "lucide-react";

const steps = [
  {
    icon: Globe,
    title: "Welcome to StellarRemit",
    description:
      "StellarRemit lets you send money across borders instantly using the Stellar blockchain. No bank delays, no hidden fees.",
  },
  {
    icon: Wallet,
    title: "Set Up Your Wallet",
    description:
      'Create a new Stellar wallet or import an existing one from another app. Your wallet is your gateway to global transfers.',
  },
  {
    icon: Banknote,
    title: "Fund Your Account",
    description:
      'Buy XLM from an exchange like Coinbase, Binance, or Kraken, then send it to your wallet address. A minimum of 1 XLM is needed to activate your account.',
  },
  {
    icon: Send,
    title: "Send Your First Payment",
    description:
      'Go to "Send Money," enter the recipient\'s Stellar address or email, choose an amount, and hit Send. Your transaction settles in seconds.',
  },
  {
    icon: CheckCircle,
    title: "You're All Set!",
    description:
      "Explore Convert to swap assets, Escrow for secure deals, and Settings to personalize your account. Welcome aboard!",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLast = currentStep === steps.length - 1;

  return (
    <Card className="border-accent/30 overflow-hidden">
      <div className="h-1.5 bg-muted">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <CardContent className="pt-8 pb-6 px-6 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
          <Icon className="h-7 w-7 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h3 className="text-xl font-bold font-serif">{step.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {step.description}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          {isLast ? (
            <Button size="sm" onClick={onComplete}>
              Get Started
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
              Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
        <button
          onClick={onComplete}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tutorial
        </button>
      </CardContent>
    </Card>
  );
};
