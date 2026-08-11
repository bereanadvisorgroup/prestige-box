import { Button } from "@/components/ui/button";
import { SimpleIcon } from "@/components/ui/simple-icon";
import { cn } from "@/lib/utils";

// Custom Microsoft icon definition matching simple-icons format
const siMicrosoft = {
  title: "Microsoft",
  slug: "microsoft",
  svg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Microsoft</title><path d="M0 0h11v11H0z M13 0h11v11H13z M0 13h11v11H0z M13 13h11v11H13z"/></svg>`,
  path: "M0 0h11v11H0z M13 0h11v11H13z M0 13h11v11H0z M13 13h11v11H13z",
  source: "https://www.microsoft.com",
  hex: "F25022",
};

export function MicrosoftButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="secondary" className={cn(className)} {...props}>
      <SimpleIcon icon={siMicrosoft} className="size-4" />
      Continue with Microsoft
    </Button>
  );
}
