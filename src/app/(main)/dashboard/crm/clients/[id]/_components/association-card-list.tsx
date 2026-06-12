import Link from "next/link";

import { ArrowUpRight, Globe, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";

interface AssociationItem {
  id: string;
  name: string;
  website?: string | null;
  phone?: string | null;
}

interface AssociationCardListProps {
  title: string;
  description: string;
  items: AssociationItem[];
  linkPrefix: string;
  icon: any;
}

export function AssociationCardList({ title, description, items, linkPrefix, icon: Icon }: AssociationCardListProps) {
  return (
    <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                  <Link href={`${linkPrefix}/${item.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
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
      </CardContent>
    </Card>
  );
}
