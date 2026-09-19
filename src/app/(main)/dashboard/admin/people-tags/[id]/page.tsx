import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, ArrowUpRight, Calendar, Edit, Tag as TagIcon, Users } from "lucide-react";

import { getTag } from "@/actions/tags";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPersonPhotoUrl } from "@/lib/social";
import { formatPersonName, getInitials } from "@/lib/utils";

interface PeopleTagDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PeopleTagDetailsPage({ params }: PeopleTagDetailsPageProps) {
  const { id } = await params;
  const result = await getTag(id);

  if (!result.success || !result.tag) {
    notFound();
  }

  const { tag, peopleCount = 0, people = [] } = result;
  const effectiveColor = tag.color || "#64748B";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg shadow-2xs"
            style={{
              backgroundColor: `${effectiveColor}1A`,
              color: effectiveColor,
            }}
          >
            <TagIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-3xl tracking-tight">{tag.name}</h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium text-xs shadow-2xs"
                style={{
                  backgroundColor: `${effectiveColor}14`,
                  borderColor: `${effectiveColor}40`,
                  color: effectiveColor,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: effectiveColor }} />
                <span className="font-mono text-[11px] uppercase">{effectiveColor}</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">People Tag Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="font-semibold shadow-xs">
            <Link href="/dashboard/admin/people-tags">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button asChild className="font-semibold shadow-xs">
            <Link href={`/dashboard/admin/people-tags/${tag.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Tag
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Metadata Card */}
        <Card className="h-fit border shadow-xs md:col-span-1">
          <CardHeader>
            <CardTitle className="font-bold text-lg">Tag Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="font-medium text-muted-foreground">Record ID</span>
              <span className="col-span-2 break-all font-mono text-foreground text-xs">{tag.id}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="font-medium text-muted-foreground">Tag Name</span>
              <span className="col-span-2 font-semibold text-foreground">{tag.name}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="font-medium text-muted-foreground">Color</span>
              <div className="col-span-2 flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border border-black/10 shadow-2xs dark:border-white/20"
                  style={{ backgroundColor: effectiveColor }}
                />
                <span className="font-mono text-xs uppercase">{effectiveColor}</span>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="font-medium text-muted-foreground">Assigned</span>
              <span className="col-span-2">
                <Badge
                  variant="outline"
                  className={
                    peopleCount > 0
                      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {peopleCount} {peopleCount === 1 ? "person" : "people"}
                </Badge>
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created At
              </span>
              <span className="col-span-2 text-foreground">
                {tag.createdAt ? new Date(tag.createdAt).toLocaleString() : "-"}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Last Updated
              </span>
              <span className="col-span-2 text-foreground">
                {tag.updatedAt ? new Date(tag.updatedAt).toLocaleString() : "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Assigned People Card */}
        <Card className="border shadow-xs md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 font-bold text-lg">
                <Users className="h-5 w-5 text-primary" />
                Assigned People ({peopleCount})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {people.length > 0 ? (
              <div className="divide-y divide-border/60">
                {people.map((person) => {
                  const personName = formatPersonName(person);
                  const initials = getInitials(personName);
                  const photoUrl = getPersonPhotoUrl(person);
                  const primaryEmail = person.emails?.[0]?.address;
                  const primaryPhone = person.phones?.[0]?.number;

                  return (
                    <div
                      key={person.id}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/10">
                          {photoUrl && <AvatarImage src={photoUrl} alt={personName} className="object-cover" />}
                          <AvatarFallback className="bg-primary/5 font-semibold text-primary text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/dashboard/crm/people/${person.id}`}
                            className="flex items-center gap-1 font-semibold text-foreground text-sm hover:text-primary hover:underline"
                          >
                            <span>{personName}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                          </Link>
                          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                            {primaryEmail && <span>{primaryEmail}</span>}
                            {primaryPhone && (
                              <span>
                                {primaryEmail && "• "}
                                {primaryPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/crm/people/${person.id}`}>
                          View Profile
                          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Users className="mb-2 h-10 w-10 stroke-1 opacity-40" />
                <p className="font-medium text-sm">No people assigned to this tag yet</p>
                <p className="mt-1 text-xs">When you assign this tag to people in the CRM, they will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
