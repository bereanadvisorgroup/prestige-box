import Link from "next/link";

import { ArrowUpRight, Briefcase } from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";

export interface CompanyEmployeeDisplayItem {
  id?: string;
  companyId?: string;
  personId: string;
  jobTitle?: string | null;
  isClient?: boolean;
  clientId?: string | null;
  person?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    photoUrl?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface CompanyEmployeesCardProps {
  employees: CompanyEmployeeDisplayItem[];
}

export function CompanyEmployeesCard({ employees = [] }: CompanyEmployeesCardProps) {
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-primary" /> Company Employees
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground text-xs uppercase">
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Job Title / Role</th>
                  <th className="p-4 text-center font-semibold">Status</th>
                  <th className="p-4 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map((employee) => {
                  const person = employee.person;
                  const name = person
                    ? `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Unknown Person"
                    : "Unknown Person";
                  const linkHref =
                    employee.isClient && employee.clientId
                      ? `/dashboard/crm/clients/${employee.clientId}`
                      : `/dashboard/crm/people/${employee.personId}`;

                  return (
                    <tr key={employee.id || employee.personId} className="transition-colors hover:bg-muted/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <PersonAvatar
                            photoUrl={person?.photoUrl}
                            firstName={person?.firstName}
                            lastName={person?.lastName}
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
                      <td className="p-4 font-medium text-muted-foreground">
                        {employee.jobTitle ? (
                          <span className="text-foreground">{employee.jobTitle}</span>
                        ) : (
                          <span className="italic text-muted-foreground/60">Employee</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {employee.isClient ? (
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
                      <td className="p-4 text-xs text-muted-foreground">
                        {person?.phone ? (
                          <p>{formatPhoneNumber(person.phone)}</p>
                        ) : person?.email ? (
                          <p className="truncate max-w-[160px]">{person.email}</p>
                        ) : (
                          <span className="text-muted-foreground/40 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Briefcase className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p>No employees currently associated with this company.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
