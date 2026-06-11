import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowUpRight,
  Contact,
  Fingerprint,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  User,
} from "lucide-react";

import { getAccountants } from "@/actions/accountants";
import { getAddress } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { getLawyers } from "@/actions/lawyers";
import { getPerson } from "@/actions/people";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";

interface PersonPageProps {
  params: {
    id: string;
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const result = await getPerson(id);

  if (!result.success || !result.person) {
    notFound();
  }

  const person = result.person;

  // Fetch roles
  const [clientsRes, lawyersRes, accountantsRes] = await Promise.all([getClients(), getLawyers(), getAccountants()]);

  const associatedClient = ((clientsRes.success && clientsRes.clients) || []).find((c) => c.personId === person.id);
  const associatedLawyer = ((lawyersRes.success && lawyersRes.lawyers) || []).find((l) => l.personId === person.id);
  const associatedAccountant = ((accountantsRes.success && accountantsRes.accountants) || []).find(
    (a) => a.personId === person.id,
  );

  // Fetch addresses
  const addressPromises = (person.addressIds || []).map((addrId) => getAddress(addrId));
  const addressResults = await Promise.all(addressPromises);
  const addresses = addressResults.map((res) => (res.success && res.address ? res.address : null)).filter(Boolean);

  const initials = `${person.firstName[0] || ""}${person.lastName[0] || ""}`.toUpperCase();

  return (
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            {person.photoUrl && (
              <AvatarImage
                src={person.photoUrl}
                alt={`${person.firstName} ${person.lastName}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="rounded-md bg-primary/5 font-bold text-2xl text-primary">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-bold text-3xl tracking-tight">
                {person.prefix && `${person.prefix} `}
                {person.firstName} {person.middleName && `${person.middleName} `}
                {person.lastName}
                {person.suffix && `, ${person.suffix}`}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {associatedClient && (
                <Link href={`/dashboard/crm/clients/${associatedClient.id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <User className="h-3 w-3" /> Client <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedLawyer && (
                <Link href={`/dashboard/crm/lawyers/${associatedLawyer.id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-purple-100 text-purple-800 hover:bg-purple-200">
                    <GraduationCap className="h-3 w-3" /> Lawyer <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedAccountant && (
                <Link href={`/dashboard/crm/accountants/${associatedAccountant.id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-amber-100 text-amber-800 hover:bg-amber-200">
                    <ReceiptText className="h-3 w-3" /> Accountant <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {!associatedClient && !associatedLawyer && !associatedAccountant && (
                <Badge variant="outline">Contact</Badge>
              )}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/crm/people/${person.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Person
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          {/* Contact Details */}
          <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Contact className="h-5 w-5 text-primary" /> Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Email Addresses
                </p>
                {person.emails && person.emails.length > 0 ? (
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

              <div>
                <p className="mt-4 mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Phone Numbers
                </p>
                {person.phones && person.phones.length > 0 ? (
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

          {/* Personal Details */}
          {(person.pii || person.driversLicense) && (
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fingerprint className="h-5 w-5 text-primary" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {person.pii && (
                  <div className="grid grid-cols-2 gap-4">
                    {person.pii.birthDate && (
                      <div>
                        <p className="font-medium text-muted-foreground text-xs">Date of Birth</p>
                        <p className="mt-0.5 font-semibold text-sm">{person.pii.birthDate}</p>
                      </div>
                    )}
                    {person.pii.biologicalGender && (
                      <div>
                        <p className="font-medium text-muted-foreground text-xs">Biological Gender</p>
                        <p className="mt-0.5 font-semibold text-sm">{person.pii.biologicalGender}</p>
                      </div>
                    )}
                    {person.pii.ssn && (
                      <div className="col-span-2">
                        <p className="font-medium text-muted-foreground text-xs">Social Security Number (SSN)</p>
                        <p className="mt-0.5 font-mono font-semibold text-sm">***-**-{person.pii.ssn.slice(-4)}</p>
                      </div>
                    )}
                  </div>
                )}

                {person.driversLicense?.number && (
                  <div className="mt-2 border-t pt-4">
                    <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Driver's License
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">License Number</p>
                        <p className="font-mono font-semibold">{person.driversLicense.number}</p>
                      </div>
                      {person.driversLicense.issueState && (
                        <div>
                          <p className="text-muted-foreground text-xs">State</p>
                          <p className="font-semibold">{person.driversLicense.issueState}</p>
                        </div>
                      )}
                      {person.driversLicense.issueDate && (
                        <div>
                          <p className="text-muted-foreground text-xs">Issue Date</p>
                          <p className="font-semibold">{person.driversLicense.issueDate}</p>
                        </div>
                      )}
                      {person.driversLicense.expirationDate && (
                        <div>
                          <p className="text-muted-foreground text-xs">Expiration Date</p>
                          <p className="font-semibold">{person.driversLicense.expirationDate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Addresses */}
        <div className="space-y-6">
          <Card className="h-full border-none shadow-md">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Associated Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address: any) => {
                    const personAddrInfo = person.addresses?.find((a) => a.id === address.id);
                    return (
                      <div
                        key={address.id}
                        className="group flex items-start justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/5"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{address.street1}</p>
                          {address.street2 && <p className="text-sm">{address.street2}</p>}
                          <p className="text-muted-foreground text-xs">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          {personAddrInfo && (
                            <Badge
                              variant={personAddrInfo.isPrimary ? "default" : "secondary"}
                              className="mt-1 py-0 text-[10px]"
                            >
                              {personAddrInfo.type} {personAddrInfo.isPrimary && "(Primary)"}
                            </Badge>
                          )}
                        </div>
                        <Link href={`/dashboard/crm/addresses/${address.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-10 w-10 opacity-20" />
                  <p className="text-sm">No addresses associated with this person.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
