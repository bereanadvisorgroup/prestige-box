import Link from "next/link";

import { ArrowUpRight, Globe, type LucideIcon, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";

import { UnlinkFirmButton } from "./unlink-firm-button";

interface AssociationItem {
  id: string;
  name: string;
  website?: string | null;
  phone?: string | null;
  isLinked?: boolean;
}

interface AssociationCardListProps {
  entityId?: string;
  title: string;
  description: string;
  items: AssociationItem[];
  linkPrefix: string;
  icon: LucideIcon;
  addLink?: string;
  actionNode?: React.ReactNode;
  onUnlinkAction?: (firmId: string, entityId: string) => Promise<{ success: boolean; error?: string }>;
}

export function AssociationCardList({
  entityId,
  title,
  description,
  items,
  linkPrefix,
  icon: Icon,
  addLink,
  actionNode,
  onUnlinkAction,
}: AssociationCardListProps) {
  return (
    <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
      <CardHeader className="bg-muted/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-5 w-5 text-primary" /> {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {actionNode}
            {addLink && !actionNode && (
              <Link href={addLink}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  + Add
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                    <div className="flex items-center">
                      <Link href={`${linkPrefix}/${item.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      {onUnlinkAction && entityId && (
                        <UnlinkFirmButton
                          firmId={item.id}
                          entityId={entityId}
                          isLinked={item.isLinked}
                          onUnlinkAction={onUnlinkAction}
                        />
                      )}
                    </div>
                  </div>
                  {item.website && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Globe className="h-3.5 w-3.5" />
                      <a
                        href={item.website.startsWith("http") ? item.website : `https://${item.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {item.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  {item.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{formatPhoneNumber(item.phone)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed bg-muted/10 p-8 text-center text-muted-foreground">
            <Icon className="mx-auto mb-3 h-8 w-8 opacity-20" />
            <p className="text-sm italic">No associated items found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
