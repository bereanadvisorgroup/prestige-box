"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

interface CompanyHeaderPortalProps {
  sectionName: string;
  children?: React.ReactNode;
}

export function CompanyHeaderPortal({ sectionName, children }: CompanyHeaderPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const nameEl = document.getElementById("company-header-section-name");
    const sepEl = document.getElementById("company-header-separator");

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

  const actionsEl = document.getElementById("company-header-actions");
  if (actionsEl && children) {
    return createPortal(children, actionsEl);
  }

  return null;
}
