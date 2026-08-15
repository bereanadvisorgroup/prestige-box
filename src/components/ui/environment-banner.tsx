"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type EnvironmentType = "LOCALHOST" | "DEVELOPMENT" | "TEST";

function detectEnvironment(): EnvironmentType | null {
  if (typeof window === "undefined") {
    return null;
  }

  const url = window.location.href.toLowerCase();

  if (url.includes("localhost")) {
    return "LOCALHOST";
  }
  if (url.includes("dev")) {
    return "DEVELOPMENT";
  }
  if (url.includes("test")) {
    return "TEST";
  }

  return null;
}

export function EnvironmentBanner() {
  const pathname = usePathname();
  const [env, setEnv] = useState<EnvironmentType | null>(null);

  useEffect(() => {
    setEnv(detectEnvironment());
  }, [pathname]);

  if (!env) {
    return null;
  }

  return (
    <aside
      aria-label={`Environment: ${env}`}
      className="pointer-events-none fixed right-0 top-1/2 z-50 -translate-y-1/2 select-none"
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-l-md border-y border-l px-1 py-3 shadow-md backdrop-blur-xs transition-all",
          "[writing-mode:vertical-rl]",
          "bg-amber-400 text-black border-amber-500/50",
          "text-[10px] font-bold tracking-widest uppercase",
        )}
      >
        {env}
      </div>
    </aside>
  );
}
