"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Contact, ExternalLink, Globe, Mail, MapPin, Pencil, Phone, User } from "lucide-react";

import { PersonForm } from "@/app/(main)/dashboard/crm/people/_components/person-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPersonLegalName, formatPhoneNumber } from "@/lib/utils";
import type { Address, Person } from "@/types/crm";

export function ContactCard({ person, addresses = [] }: { person: Person; addresses?: Address[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const legalName = formatPersonLegalName(person);

  return (
    <Card className="h-full border-none shadow-md">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Contact className="h-5 w-5 text-primary" /> Contact Details
          </span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Edit Person
                </DialogTitle>
                <DialogDescription>
                  Update contact information, name details, addresses, and social media accounts.
                </DialogDescription>
              </DialogHeader>
              <div className="pt-2">
                <PersonForm
                  person={person}
                  isDialog
                  onSuccess={() => {
                    setOpen(false);
                    router.refresh();
                  }}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Legal Name</p>
          <p className="mt-0.5 font-semibold text-sm">{legalName || "—"}</p>
        </div>

        <div className="border-t pt-4">
          <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email Addresses</p>
          {person?.emails && person.emails.length > 0 ? (
            <div className="space-y-2">
              {person.emails.map((email) => (
                <div key={email.id} className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
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

        <div className="border-t pt-4">
          <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Phone Numbers</p>
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

        <div className="border-t pt-4">
          <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Social Media Accounts
          </p>
          {person?.socialMedia && person.socialMedia.length > 0 ? (
            <div className="space-y-2">
              {person.socialMedia.map((sm, idx) => (
                <div key={sm.id || sm.url || idx} className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
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
                    className="flex items-start justify-between rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-muted/5"
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                        >
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
      </CardContent>
    </Card>
  );
}
