import Link from "next/link";

import { ArrowUpRight, Users } from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPersonName } from "@/lib/utils";

export interface CompanyOwnerDisplayItem {
  id?: string;
  companyId?: string;
  personId: string;
  ownershipPercentage: number | string;
  isClient?: boolean;
  clientId?: string | null;
  person?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    suffix?: string | null;
    goesBy?: string | null;
    photoUrl?: string | null;
  } | null;
}

interface CompanyOwnersCardProps {
  owners: CompanyOwnerDisplayItem[];
  estimatedValue?: number | string | null;
}

export function CompanyOwnersCard({ owners = [], estimatedValue = 0 }: CompanyOwnersCardProps) {
  const totalValue = Number(estimatedValue) || 0;

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-primary" /> Company Owners
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {owners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground text-xs uppercase">
                  <th className="p-4 font-semibold">Owner</th>
                  <th className="p-4 text-right font-semibold">Ownership</th>
                  <th className="p-4 text-center font-semibold">Status</th>
                  <th className="p-4 text-right font-semibold">Estimated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {owners.map((owner) => {
                  const person = owner.person;
                  const name = formatPersonName(person);
                  const linkHref =
                    owner.isClient && owner.clientId
                      ? `/dashboard/crm/clients/${owner.clientId}`
                      : `/dashboard/crm/people/${owner.personId}`;
                  const percentage = Number(owner.ownershipPercentage) || 0;
                  const ownerValue = (percentage / 100) * totalValue;

                  return (
                    <tr key={owner.id || owner.personId} className="transition-colors hover:bg-muted/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <PersonAvatar
                            photoUrl={person?.photoUrl}
                            firstName={person?.firstName}
                            lastName={person?.lastName}
                            goesBy={person?.goesBy}
                            size="sm"
                          />
                          <Link
                            href={linkHref}
                            className="flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            <span>{name}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                          </Link>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">{percentage.toFixed(2)}%</td>
                      <td className="p-4 text-center">
                        {owner.isClient ? (
                          <Badge
                            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            variant="outline"
                          >
                            Client
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground">
                            Non-Client
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold text-sm">{formatCurrency(ownerValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p>No owners currently associated with this company.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
