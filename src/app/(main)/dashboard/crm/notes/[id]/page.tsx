import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { NoteThread } from "@/components/notes/note-thread";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteThreadPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="w-fit gap-1.5 text-muted-foreground">
        <Link href="/dashboard/crm/notes">
          <ArrowLeft className="h-4 w-4" />
          All notes
        </Link>
      </Button>
      <NoteThread noteId={id} />
    </div>
  );
}
