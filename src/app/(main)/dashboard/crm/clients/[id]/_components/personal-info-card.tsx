import Link from "next/link";

import { Fingerprint, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Person } from "@/types/crm";

export function PersonalInfoCard({ person, clientId }: { person: Person; clientId?: string }) {
  if (!person?.pii && !person?.driversLicense) {
    return (
      <Card className="h-full border-none shadow-md">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" /> Personal Information
            </span>
            {clientId && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/crm/clients/${clientId}/personal`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">No personal information listed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-none shadow-md">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" /> Personal Information
          </span>
          {clientId && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/crm/clients/${clientId}/personal`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
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
  );
}
