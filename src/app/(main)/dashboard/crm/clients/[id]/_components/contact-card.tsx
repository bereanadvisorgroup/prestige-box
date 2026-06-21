import { Contact, Phone, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";
import type { Person } from "@/types/crm";

export function ContactCard({ person }: { person: Person }) {
  return (
    <Card className="h-full border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Contact className="h-5 w-5 text-primary" /> Contact Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email Addresses</p>
          {person?.emails && person.emails.length > 0 ? (
            <div className="space-y-2">
              {person.emails.map((email) => (
                <div key={email.id} className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{email.address}</span>
                  <Badge variant={email.isPrimary ? "default" : "outline"} className="px-1.5 py-0 text-[10px]">
                    {email.type} {email.isPrimary && "(Primary)"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No email addresses listed.</p>
          )}
        </div>

        <div>
          <p className="mt-4 mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Phone Numbers
          </p>
          {person?.phones && person.phones.length > 0 ? (
            <div className="space-y-2">
              {person.phones.map((phone) => (
                <div key={phone.id} className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{formatPhoneNumber(phone.number)}</span>
                  <Badge variant={phone.isPrimary ? "default" : "outline"} className="px-1.5 py-0 text-[10px]">
                    {phone.type} {phone.isPrimary && "(Primary)"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No phone numbers listed.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
