import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-50">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(14,62,88,0.3),rgba(3,2,5,1))]" />
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center lg:px-8">
        {/* Logo */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
          <img
            src="https://assets.agentfire3.com/uploads/sites/2548/2026/01/Prestige-Advisors-logo-white-210xAUTO.fit.png"
            alt="Prestige Advisors Logo"
            className="h-16 w-auto object-contain sm:h-20"
          />
        </div>

        {/* Hero Content */}
        <h1 className="mb-6 max-w-4xl text-balance font-bold text-4xl leading-tight tracking-tight sm:text-6xl md:text-7xl">
          <span
            className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-both"
            style={{ animationDelay: "100ms" }}
          >
            Strategic Wealth & CRM
          </span>
          <br />
          <span
            className="animate-in fade-in slide-in-from-bottom-8 bg-gradient-to-r from-secondary via-secondary/80 to-secondary/50 bg-clip-text text-transparent duration-1000 ease-out fill-mode-both"
            style={{ animationDelay: "200ms" }}
          >
            For Business Owners
          </span>
        </h1>

        <p className="mb-10 max-w-2xl text-balance text-lg text-slate-400 sm:text-xl md:text-2xl">
          <span
            className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-both"
            style={{ animationDelay: "300ms" }}
          >
            Experience that brings clarity. Access your financial planning insights and connect with our advisory team
            in one secure portal.
          </span>
        </p>

        {/* Call to Action */}
        <div
          className="flex flex-col gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-both"
          style={{ animationDelay: "400ms" }}
        >
          <Button
            asChild
            size="lg"
            className="h-14 gap-2 rounded-full px-8 text-lg font-medium shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
          >
            <Link href="/auth/v1/login">
              Login to Portal
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-slate-800 bg-slate-900/50 px-8 text-lg font-medium text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white"
          >
            <Link href="https://prestigeadvisors360.com/" target="_blank" rel="noopener noreferrer">
              Visit Main Website
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer Text */}
      <div
        className="absolute bottom-8 text-center text-sm text-slate-500 animate-in fade-in duration-1000 fill-mode-both"
        style={{ animationDelay: "800ms" }}
      >
        © {new Date().getFullYear()} Prestige Advisors. All rights reserved.
      </div>
    </div>
  );
}
