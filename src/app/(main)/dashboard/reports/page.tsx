import Link from "next/link";

import { ArrowRight, BarChart3, Clock, DollarSign, Share2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Report Center | Prestige Box",
};

export default function ReportCenterPage() {
  const reports = [
    {
      title: "Benefit Payments",
      description: "Track monthly benefit premium collections, scheduling, and collection forecasts.",
      href: "/dashboard/reports/payments",
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      title: "Relationship Graph",
      description: "Visualize and explore connection graphs between people, households, and companies.",
      href: "/dashboard/reports/relationship-graph",
      icon: BarChart3,
      color: "bg-blue-500",
    },
    {
      title: "History",
      description: "Review History of Clients and Companies",
      href: "/dashboard/reports/history",
      icon: Clock,
      color: "bg-cyan-500",
    },
    {
      title: "Referrals",
      description:
        "Explore the referral tree, referral-type mix, and how many clients were referred over the past year.",
      href: "/dashboard/reports/referrals",
      icon: Share2,
      color: "bg-violet-500",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Report Center</h1>
        <p className="mt-2 text-muted-foreground">
          Select a report below to view detailed analytics and visualizations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href} className="group block">
              <Card className="h-full border border-muted transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`${report.color} rounded-xl p-3 text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardTitle className="font-bold text-lg group-hover:text-primary transition-colors">
                    {report.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {report.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
