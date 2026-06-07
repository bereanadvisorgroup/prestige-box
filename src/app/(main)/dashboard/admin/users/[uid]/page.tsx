import Link from "next/link";
import { notFound } from "next/navigation";

import { format } from "date-fns";
import { Calendar, Fingerprint, Mail, Pencil, Shield, User } from "lucide-react";

import { getUser } from "@/actions/users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserPageProps {
  params: {
    uid: string;
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { uid } = await params;
  const result = await getUser(uid);

  if (!result.success || !result.user) {
    notFound();
  }

  const user = result.user;
  const initials = `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase();

  return (
    <div className="fade-in mx-auto w-full max-w-4xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            <AvatarFallback className="rounded-md bg-primary/5 font-bold text-2xl text-primary">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                <Shield className="mr-1 h-3 w-3" /> {user.role}
              </Badge>
            </div>
          </div>
        </div>
        <Link href={`/dashboard/admin/users/${user.uid}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit User
          </Button>
        </Link>
      </div>

      {/* User Details */}
      <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">User ID (UID)</p>
                <p className="mt-1 font-mono font-semibold text-sm">{user.uid}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email Address</p>
                <p className="mt-1 font-semibold text-sm">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date Created</p>
                <p className="mt-1 font-semibold text-sm">
                  {user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy 'at' h:mm a") : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
