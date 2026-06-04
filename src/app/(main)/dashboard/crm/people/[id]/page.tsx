import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Contact,
  CreditCard,
  FileText,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10 rounded-md">
            <AvatarFallback className="text-2xl bg-primary/5 text-primary rounded-md font-bold">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">
                {person.prefix && `${person.prefix} `}
                {person.firstName} {person.middleName && `${person.middleName} `}
                {person.lastName}
                {person.suffix && `, ${person.suffix}`}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {associatedClient && (
                <Link href={`/dashboard/crm/clients/${associatedClient.id}`}>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none cursor-pointer flex items-center gap-1">
                    <User className="h-3 w-3" /> Client <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedLawyer && (
                <Link href={`/dashboard/crm/lawyers/${associatedLawyer.id}`}>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none cursor-pointer flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Lawyer <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedAccountant && (
                <Link href={`/dashboard/crm/accountants/${associatedAccountant.id}`}>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none cursor-pointer flex items-center gap-1">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Contact Details */}
          <Card className="border-none shadow-md bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Contact className="h-5 w-5 text-primary" /> Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Email Addresses
                </p>
                {person.emails && person.emails.length > 0 ? (
                  <div className="space-y-2">
                    {person.emails.map((email) => (
                      <div key={email.id} className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{email.address}</span>
                        <Badge variant={email.isPrimary ? "default" : "outline"} className="text-[10px] py-0 px-1.5">
                          {email.type} {email.isPrimary && "(Primary)"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No email addresses listed.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                  Phone Numbers
                </p>
                {person.phones && person.phones.length > 0 ? (
                  <div className="space-y-2">
                    {person.phones.map((phone) => (
                      <div key={phone.id} className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{formatPhoneNumber(phone.number)}</span>
                        <Badge variant={phone.isPrimary ? "default" : "outline"} className="text-[10px] py-0 px-1.5">
                          {phone.type} {phone.isPrimary && "(Primary)"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No phone numbers listed.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          {(person.pii || person.driversLicense) && (
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {person.pii && (
                  <div className="grid grid-cols-2 gap-4">
                    {person.pii.birthDate && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Date of Birth</p>
                        <p className="text-sm font-semibold mt-0.5">{person.pii.birthDate}</p>
                      </div>
                    )}
                    {person.pii.biologicalGender && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Biological Gender</p>
                        <p className="text-sm font-semibold mt-0.5">{person.pii.biologicalGender}</p>
                      </div>
                    )}
                    {person.pii.ssn && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-muted-foreground">Social Security Number (SSN)</p>
                        <p className="text-sm font-semibold mt-0.5 font-mono">***-**-{person.pii.ssn.slice(-4)}</p>
                      </div>
                    )}
                  </div>
                )}

                {person.driversLicense && person.driversLicense.number && (
                  <div className="border-t pt-4 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Driver's License
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">License Number</p>
                        <p className="font-semibold font-mono">{person.driversLicense.number}</p>
                      </div>
                      {person.driversLicense.issueState && (
                        <div>
                          <p className="text-xs text-muted-foreground">State</p>
                          <p className="font-semibold">{person.driversLicense.issueState}</p>
                        </div>
                      )}
                      {person.driversLicense.issueDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Issue Date</p>
                          <p className="font-semibold">{person.driversLicense.issueDate}</p>
                        </div>
                      )}
                      {person.driversLicense.expirationDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Expiration Date</p>
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
          <Card className="border-none shadow-md h-full">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
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
                        className="p-4 border rounded-lg bg-card hover:bg-muted/5 transition-colors group flex justify-between items-start"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{address.street1}</p>
                          {address.street2 && <p className="text-sm">{address.street2}</p>}
                          <p className="text-xs text-muted-foreground">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          {personAddrInfo && (
                            <Badge
                              variant={personAddrInfo.isPrimary ? "default" : "secondary"}
                              className="text-[10px] py-0 mt-1"
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
                <div className="text-center p-8 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto opacity-20 mb-2" />
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
