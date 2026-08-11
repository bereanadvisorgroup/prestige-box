"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

interface HouseholdHeaderPortalProps {
  sectionName: string;
  children?: React.ReactNode;
}

export function HouseholdHeaderPortal({ sectionName, children }: HouseholdHeaderPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const nameEl = document.getElementById("household-header-section-name");
    const sepEl = document.getElementById("household-header-separator");

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

  const actionsEl = document.getElementById("household-header-actions");
  if (actionsEl && children) {
    return createPortal(children, actionsEl);
  }

  return null;
}
