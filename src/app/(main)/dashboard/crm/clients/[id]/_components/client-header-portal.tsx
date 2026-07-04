"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

interface ClientHeaderPortalProps {
  sectionName: string;
  children?: React.ReactNode;
}

export function ClientHeaderPortal({ sectionName, children }: ClientHeaderPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const nameEl = document.getElementById("client-header-section-name");
    const sepEl = document.getElementById("client-header-separator");

    if (nameEl) {
      nameEl.textContent = sectionName;
    }
    if (sepEl) {
      sepEl.classList.remove("hidden");
    }

    return () => {
      if (nameEl) {
        nameEl.textContent = "";
      }
      if (sepEl) {
        sepEl.classList.add("hidden");
      }
    };
  }, [sectionName]);

  if (!mounted) return null;

  const actionsEl = document.getElementById("client-header-actions");
  if (actionsEl && children) {
    return createPortal(children, actionsEl);
  }

  return null;
}
