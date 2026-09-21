"use client";

import { Building2, ExternalLink, Fingerprint, Globe, MapPin, Phone, UserCog } from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/utils";
import type { Address, Company, SocialMediaAccount } from "@/types/crm";

interface CompanyDrawerContentProps {
  company: Company;
  address: Address | null;
  advisor: {
    uid: string;
    firstName: string | null;
    lastName: string | null;
    photoURL?: string | null;
    role?: string | null;
  } | null;
}

export function CompanyDrawerContent({ company, address, advisor }: CompanyDrawerContentProps) {
  return (
    <div className="space-y-6 pt-2 pb-6">
      {/* DBA */}
      {company.dba && (
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Doing Business As</p>
            <p className="mt-1 font-semibold text-sm">{company.dba}</p>
          </div>
        </div>
      )}

      {/* EIN */}
      {company.ein && (
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
            <Fingerprint className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Federal Tax ID (EIN)</p>
            <p className="mt-1 font-mono font-semibold text-sm">{company.ein}</p>
          </div>
        </div>
      )}

      {/* Website */}
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
          <Globe className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Website</p>
          {company.website ? (
            <a
              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-semibold text-blue-600 text-sm hover:underline dark:text-blue-400"
            >
              <span>{company.website.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="mt-1 font-semibold text-sm text-muted-foreground">N/A</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
          <Phone className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Phone</p>
          {company.phone ? (
            <a
              href={`tel:${company.phone}`}
              className="mt-1 block font-semibold text-sm text-foreground hover:underline"
            >
              {formatPhoneNumber(company.phone)}
            </a>
          ) : (
            <p className="mt-1 font-semibold text-sm text-muted-foreground">N/A</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
          <MapPin className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Address</p>
          {address ? (
            <div className="mt-1 font-semibold text-sm">
              <p>{address.street1}</p>
              {address.street2 && <p>{address.street2}</p>}
              <p>
                {address.city}, {address.state} {address.zipCode}
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs">{address.country}</p>
            </div>
          ) : (
            <p className="mt-1 font-semibold text-sm text-muted-foreground">N/A</p>
          )}
        </div>
      </div>

      {/* Assigned Advisor */}
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
          <UserCog className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Assigned Advisor</p>
          {advisor ? (
            <div className="mt-1 flex items-center gap-2">
              <PersonAvatar
                photoUrl={advisor.photoURL}
                firstName={advisor.firstName}
                lastName={advisor.lastName}
                size="sm"
              />
              <span className="font-semibold text-sm">
                {advisor.firstName} {advisor.lastName}
              </span>
              {advisor.role && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">
                  {advisor.role}
                </Badge>
              )}
            </div>
          ) : (
            <p className="mt-1 text-muted-foreground/60 text-sm italic">Unassigned</p>
          )}
        </div>
      </div>

      {/* Social Media Accounts */}
      {company.socialMedia && company.socialMedia.length > 0 && (
        <div className="border-t pt-4">
          <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Social Media Accounts
          </p>
          <div className="space-y-2">
            {company.socialMedia.map((sm: SocialMediaAccount, idx: number) => (
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
        </div>
      )}
    </div>
  );
}
