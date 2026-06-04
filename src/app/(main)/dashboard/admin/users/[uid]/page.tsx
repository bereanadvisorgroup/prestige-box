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
    <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10 rounded-md">
            <AvatarFallback className="text-2xl bg-primary/5 text-primary rounded-md font-bold">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                <Shield className="h-3 w-3 mr-1" /> {user.role}
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
      <Card className="border-none shadow-md bg-gradient-to-b from-card to-muted/20">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID (UID)</p>
                <p className="text-sm font-semibold mt-1 font-mono">{user.uid}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-semibold mt-1">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Created</p>
                <p className="text-sm font-semibold mt-1">
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
