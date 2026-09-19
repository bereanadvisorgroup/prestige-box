"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

interface PersonHeaderPortalProps {
  sectionName: string;
  children?: React.ReactNode;
}

export function PersonHeaderPortal({ sectionName, children }: PersonHeaderPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const nameEl = document.getElementById("person-header-section-name");
    const sepEl = document.getElementById("person-header-separator");

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

  const actionsEl = document.getElementById("person-header-actions");
  if (actionsEl && children) {
    return createPortal(children, actionsEl);
  }

  return null;
}
