"use client";

import Link from "next/link";

import { ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPersonLegalName, formatPhoneNumber } from "@/lib/utils";
import type { Address, Person } from "@/types/crm";

interface ClientDrawerContentProps {
  person: Person | null;
  addresses: Address[];
}

export function ClientDrawerContent({ person, addresses = [] }: ClientDrawerContentProps) {
  if (!person) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No contact details available for this client.
      </div>
    );
  }

  const legalName = formatPersonLegalName(person);

  return (
    <div className="space-y-6 pt-2 pb-6">
      {/* Legal Name */}
      <div>
        <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Legal Name</p>
        <p className="mt-1 font-semibold text-sm">{legalName || "—"}</p>
      </div>

      {/* Email Addresses */}
      <div className="border-t pt-4">
        <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email Addresses</p>
        {person.emails && person.emails.length > 0 ? (
          <div className="space-y-2">
            {person.emails.map((email) => (
              <div key={email.id} className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`mailto:${email.address}`} className="font-medium text-foreground hover:underline">
                  {email.address}
                </a>
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

      {/* Phone Numbers */}
      <div className="border-t pt-4">
        <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Phone Numbers</p>
        {person.phones && person.phones.length > 0 ? (
          <div className="space-y-2">
            {person.phones.map((phone) => (
              <div key={phone.id} className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`tel:${phone.number}`} className="font-medium text-foreground hover:underline">
                  {formatPhoneNumber(phone.number)}
                </a>
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

      {/* Social Media Accounts */}
      <div className="border-t pt-4">
        <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Social Media Accounts
        </p>
        {person.socialMedia && person.socialMedia.length > 0 ? (
          <div className="space-y-2">
            {person.socialMedia.map((sm, idx) => (
              <div key={sm.id || sm.url || idx} className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={sm.url.startsWith("http") ? sm.url : `https://${sm.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  {sm.type}
                </a>
                <Badge variant={sm.isPrimary ? "default" : "outline"} className="px-1.5 py-0 text-[10px]">
                  {sm.isPrimary ? "Primary" : "Secondary"}
                  {sm.useProfilePhoto && " (Using Photo)"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No social media accounts listed.</p>
        )}
      </div>

      {/* Associated Addresses */}
      <div className="border-t pt-4">
        <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Associated Addresses
        </p>
        {addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((address, idx) => {
              const personAddrInfo = person.addresses?.find((a) => a.id === address.id);
              return (
                <div
                  key={address.id || idx}
                  className="flex items-start justify-between rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-muted/10"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-semibold text-sm">{address.street1}</span>
                      {personAddrInfo && (
                        <Badge
                          variant={personAddrInfo.isPrimary ? "default" : "secondary"}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {personAddrInfo.type} {personAddrInfo.isPrimary && "(Primary)"}
                        </Badge>
                      )}
                    </div>
                    {address.street2 && <p className="pl-6 text-muted-foreground text-xs">{address.street2}</p>}
                    <p className="pl-6 text-muted-foreground text-xs">
                      {address.city}
                      {address.city && address.state ? ", " : ""}
                      {address.state} {address.zipCode}
                    </p>
                  </div>
                  {address.id && (
                    <Link href={`/dashboard/crm/addresses/${address.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No associated addresses listed.</p>
        )}
      </div>
    </div>
  );
}
