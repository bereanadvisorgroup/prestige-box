import { CircleDollarSign, TrendingUp } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="relative flex flex-col items-center justify-center p-8 text-center">
        {/* Outer glow background */}
        <div className="absolute h-48 w-48 animate-pulse rounded-full bg-primary/5 blur-3xl" />

        {/* Money Animation Group */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Spinning track ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/10 border-t-primary/60 [animation-duration:3s]" />

          {/* Counter-spinning inner ring */}
          <div className="absolute inset-2 animate-spin rounded-full border border-secondary/20 border-b-secondary border-dashed [animation-direction:reverse] [animation-duration:2s]" />

          {/* Bouncing Money Stack */}
          <div className="relative flex animate-bounce items-center justify-center [animation-duration:1.5s]">
            {/* Shadow coin */}
            <div className="absolute h-16 w-16 translate-x-2 translate-y-2 rounded-full bg-secondary/20 blur-[1px]" />

            {/* Primary Golden Coin */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-amber-950 shadow-[0_4px_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50">
              <CircleDollarSign className="h-9 w-9 animate-pulse" />
            </div>

            {/* Smaller floating dollar coins */}
            <div className="absolute -top-3 -right-3 flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 text-emerald-950 shadow-[0_2px_8px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50">
              <span className="font-bold text-xs">$</span>
            </div>

            <div className="absolute -bottom-1 -left-4 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 text-amber-950 shadow-[0_2px_6px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/30">
              <span className="font-bold text-[10px]">$</span>
            </div>
          </div>
        </div>

        {/* Premium textual context */}
        <div className="z-10 mt-6 space-y-1.5">
          <h3 className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text font-semibold text-lg text-transparent tracking-wide">
            Loading Financial Portfolio
          </h3>
          <p className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
            <TrendingUp className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
            Securing assets & calculating growth...
          </p>
        </div>
      </div>
    </div>
  );
}
