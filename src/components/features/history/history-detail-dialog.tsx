"use client";

import Link from "next/link";

import { format } from "date-fns";
import { Building2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ChangeHistoryWithEntity } from "@/types/crm";

interface HistoryDetailDialogProps {
  record: ChangeHistoryWithEntity | null;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="col-span-2 text-sm">{children}</div>
    </div>
  );
}

/** A full, untruncated value block (preserves whitespace, wraps long strings). */
function ValueBlock({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/50 p-2 font-mono text-xs">{value}</pre>;
}

export function HistoryDetailDialog({ record, onOpenChange }: HistoryDetailDialogProps) {
  const open = record !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {record && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase">
                  {record.action}
                </Badge>
                {record.fieldLabel ?? record.summary ?? "Change"}
              </DialogTitle>
              <DialogDescription>{record.summary}</DialogDescription>
            </DialogHeader>

            <div className="divide-y">
              <Field label="Date">
                {record.changedAt ? format(new Date(record.changedAt), "MMMM d, yyyy 'at' h:mm:ss a") : "—"}
              </Field>

              {record.entityName !== null && (
                <Field label="Record">
                  <Link
                    href={
                      record.entityType === "client"
                        ? `/dashboard/crm/clients/${record.entityId}`
                        : `/dashboard/crm/companies/${record.entityId}`
                    }
                    className="flex items-center gap-2 decoration-primary/50 underline-offset-4 hover:underline"
                  >
                    {record.entityType === "client" ? (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{record.entityName || "(deleted)"}</span>
                  </Link>
                </Field>
              )}

              <Field label="Type">
                <span className="capitalize">{record.entityType}</span>
              </Field>

              <Field label="Category">
                <Badge variant="outline" className="font-normal">
                  {record.subType}
                </Badge>
              </Field>

              {record.fieldLabel && <Field label="Field">{record.fieldLabel}</Field>}

              <Field label="Old Value">
                <ValueBlock value={record.oldValue} />
              </Field>

              <Field label="New Value">
                <ValueBlock value={record.newValue} />
              </Field>

              <Field label="Changed By">{record.actorName ?? "System"}</Field>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
