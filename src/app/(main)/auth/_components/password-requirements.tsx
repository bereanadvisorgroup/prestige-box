import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
  password?: string;
}

export function PasswordRequirements({ password = "" }: PasswordRequirementsProps) {
  const requirements = [
    {
      regex: /.{8,}/,
      text: "Must be at least 8 characters",
    },
    {
      regex: /[0-9]/,
      text: "Must contain at least 1 number",
    },
    {
      regex: /[A-Z]/,
      text: "Must contain at least 1 uppercase letter",
    },
    {
      regex: /[a-z]/,
      text: "Must contain at least 1 lowercase letter",
    },
    {
      regex: /[^a-zA-Z0-9]/,
      text: "Must contain at least 1 special character",
    },
  ];

  // If there's no password yet, we might still want to show the requirements as unmet,
  // or we can just render the list. The image shows the list present when empty or typing.

  return (
    <ul className="mt-2 space-y-1 text-sm">
      {requirements.map((req, index) => {
        const isMet = req.regex.test(password);

        return (
          <li key={index} className={cn("flex items-center gap-2", isMet ? "text-emerald-600" : "text-destructive")}>
            {isMet ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span>{req.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
