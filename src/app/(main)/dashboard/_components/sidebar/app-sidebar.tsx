"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ArrowLeft,
  Briefcase,
  Calculator,
  Clock,
  Command,
  Database,
  DollarSign,
  FileText,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  LayoutDashboard,
  ListTodo,
  ReceiptText,
  Scale,
  Shield,
  ShieldAlert,
  StickyNote,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { getClientAssociationCounts } from "@/actions/clients";
import { getCompanyAssociationCounts } from "@/actions/companies";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import type { NavGroup } from "@/navigation/sidebar/sidebar-items";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { useAuthStore } from "@/stores/auth.store";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";

const getClientSidebarItems = (clientId: string, counts: Record<string, number>): NavGroup[] => [
  {
    id: 10,
    items: [
      {
        title: "Back to Clients",
        url: "/dashboard/crm/clients",
        icon: ArrowLeft,
      },
    ],
  },
  {
    id: 11,
    label: "Internal",
    items: [
      {
        title: "Overview",
        url: `/dashboard/crm/clients/${clientId}/internal`,
        icon: LayoutDashboard,
      },
      {
        title: "Notes",
        url: `/dashboard/crm/clients/${clientId}/internal/notes`,
        icon: StickyNote,
      },
      {
        title: "Tasks",
        url: `/dashboard/crm/clients/${clientId}/internal/tasks`,
        icon: ListTodo,
      },
      {
        title: "History",
        url: `/dashboard/crm/clients/${clientId}/internal/history`,
        icon: Clock,
      },
    ],
  },
  {
    id: 12,
    label: "General Info",
    items: [
      {
        title: "Overview",
        url: `/dashboard/crm/clients/${clientId}/overview`,
        icon: LayoutDashboard,
      },
      {
        title: "Family",
        url: `/dashboard/crm/clients/${clientId}/family`,
        icon: Users,
      },
      {
        title: "Employment",
        url: `/dashboard/crm/clients/${clientId}/employment`,
        icon: Briefcase,
      },
      {
        title: "Estate Planning",
        url: `/dashboard/crm/clients/${clientId}/estate-planning`,
        icon: FileText,
      },
      {
        title: "Assets",
        url: `/dashboard/crm/clients/${clientId}/assets`,
        icon: Home,
      },
      {
        title: "Liabilities",
        url: `/dashboard/crm/clients/${clientId}/liabilities`,
        icon: DollarSign,
      },
    ],
  },
  {
    id: 13,
    label: "Professional Services",
    items: [
      {
        title: "Accounting Firms",
        url: `/dashboard/crm/clients/${clientId}/accounting-firms`,
        icon: ReceiptText,
        badge: counts.accountingFirms || 0,
      },
      {
        title: "Actuarial Firms",
        url: `/dashboard/crm/clients/${clientId}/actuarial-firms`,
        icon: Calculator,
        badge: counts.actuarialFirms || 0,
      },
      {
        title: "Banks",
        url: `/dashboard/crm/clients/${clientId}/banks`,
        icon: Landmark,
        badge: counts.banks || 0,
      },
      {
        title: "Law Firms",
        url: `/dashboard/crm/clients/${clientId}/law-firms`,
        icon: Scale,
        badge: counts.lawFirms || 0,
      },
      {
        title: "Property And Casualty",
        url: `/dashboard/crm/clients/${clientId}/property-and-casualty`,
        icon: Shield,
        badge: counts.propertyAndCasualty || 0,
      },
    ],
  },
  {
    id: 14,
    label: "Vendors",
    items: [
      {
        title: "Life Insurance",
        url: `/dashboard/crm/clients/${clientId}/life-insurance`,
        icon: HeartHandshake,
        badge: counts.lifeInsurance || 0,
      },
      {
        title: "Disability Insurance",
        url: `/dashboard/crm/clients/${clientId}/disability-insurance`,
        icon: ShieldAlert,
        badge: counts.disabilityInsurance || 0,
      },
      {
        title: "Long Term Care",
        url: `/dashboard/crm/clients/${clientId}/long-term-care`,
        icon: HeartPulse,
        badge: counts.longTermCare || 0,
      },
      {
        title: "Money Managers",
        url: `/dashboard/crm/clients/${clientId}/money-managers`,
        icon: TrendingUp,
        badge: counts.moneyManagers || 0,
      },
      {
        title: "Record Keepers",
        url: `/dashboard/crm/clients/${clientId}/record-keepers`,
        icon: Database,
        badge: counts.recordKeepers || 0,
      },
    ],
  },
];

const getCompanySidebarItems = (companyId: string, counts: Record<string, number>): NavGroup[] => [
  {
    id: 20,
    items: [
      {
        title: "Back to Companies",
        url: "/dashboard/crm/companies",
        icon: ArrowLeft,
      },
    ],
  },
  {
    id: 21,
    label: "Internal",
    items: [
      {
        title: "Overview",
        url: `/dashboard/crm/companies/${companyId}/internal`,
        icon: LayoutDashboard,
      },
      {
        title: "Notes",
        url: `/dashboard/crm/companies/${companyId}/internal/notes`,
        icon: StickyNote,
      },
      {
        title: "Tasks",
        url: `/dashboard/crm/companies/${companyId}/internal/tasks`,
        icon: ListTodo,
      },
      {
        title: "History",
        url: `/dashboard/crm/companies/${companyId}/internal/history`,
        icon: Clock,
      },
    ],
  },
  {
    id: 22,
    label: "General Info",
    items: [
      {
        title: "General",
        url: `/dashboard/crm/companies/${companyId}`,
        icon: LayoutDashboard,
      },
      {
        title: "Valuation",
        url: `/dashboard/crm/companies/${companyId}/valuation`,
        icon: DollarSign,
      },
    ],
  },
  {
    id: 23,
    label: "Professional Services",
    items: [
      {
        title: "Accounting Firms",
        url: `/dashboard/crm/companies/${companyId}/accounting-firms`,
        icon: ReceiptText,
        badge: counts.accountingFirms || 0,
      },
      {
        title: "Actuarial Firms",
        url: `/dashboard/crm/companies/${companyId}/actuarial-firms`,
        icon: Calculator,
        badge: counts.actuarialFirms || 0,
      },
      {
        title: "Banks",
        url: `/dashboard/crm/companies/${companyId}/banks`,
        icon: Landmark,
        badge: counts.banks || 0,
      },
      {
        title: "Law Firms",
        url: `/dashboard/crm/companies/${companyId}/law-firms`,
        icon: Scale,
        badge: counts.lawFirms || 0,
      },
      {
        title: "Property And Casualty",
        url: `/dashboard/crm/companies/${companyId}/property-and-casualty`,
        icon: Shield,
        badge: counts.propertyAndCasualty || 0,
      },
    ],
  },
  {
    id: 24,
    label: "Vendors",
    items: [
      {
        title: "Life Insurance",
        url: `/dashboard/crm/companies/${companyId}/life-insurance`,
        icon: HeartHandshake,
        badge: counts.lifeInsurance || 0,
      },
      {
        title: "Disability Insurance",
        url: `/dashboard/crm/companies/${companyId}/disability-insurance`,
        icon: ShieldAlert,
        badge: counts.disabilityInsurance || 0,
      },
      {
        title: "Long Term Care",
        url: `/dashboard/crm/companies/${companyId}/long-term-care`,
        icon: HeartPulse,
        badge: counts.longTermCare || 0,
      },
      {
        title: "Money Managers",
        url: `/dashboard/crm/companies/${companyId}/money-managers`,
        icon: TrendingUp,
        badge: counts.moneyManagers || 0,
      },
      {
        title: "Record Keepers",
        url: `/dashboard/crm/companies/${companyId}/record-keepers`,
        icon: Database,
        badge: counts.recordKeepers || 0,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  // Retrieve current user profile to determine role
  const { profile } = useAuthStore();
  const userRole = profile?.role || "client"; // Default to least privileged or handle null case

  const isCrmStaff = userRole === "admin" || userRole === "advisor";
  const clientMatch = pathname.match(/^\/dashboard\/crm\/clients\/([a-zA-Z0-9-]+)/);
  const clientId = clientMatch && clientMatch[1] !== "new" && clientMatch[1] !== "edit" ? clientMatch[1] : null;

  const companyMatch = pathname.match(/^\/dashboard\/crm\/companies\/([a-zA-Z0-9-]+)/);
  const companyId = companyMatch && companyMatch[1] !== "new" && companyMatch[1] !== "edit" ? companyMatch[1] : null;

  const isClientView = isCrmStaff && clientId;
  const isCompanyView = isCrmStaff && companyId;

  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const _path = pathname;
    const fetchCounts = () => {
      if (clientId) {
        getClientAssociationCounts(clientId).then((res) => {
          if (res.success && res.counts) {
            setCounts(res.counts);
          }
        });
      } else if (companyId) {
        getCompanyAssociationCounts(companyId).then((res) => {
          if (res.success && res.counts) {
            setCounts(res.counts);
          }
        });
      }
    };

    fetchCounts();

    window.addEventListener("association-change", fetchCounts);
    return () => {
      window.removeEventListener("association-change", fetchCounts);
    };
  }, [clientId, companyId, pathname]);

  // Filter sidebar items based on user role or client/company context
  const filteredSidebarItems = isClientView
    ? getClientSidebarItems(clientId, counts)
    : isCompanyView
      ? getCompanySidebarItems(companyId, counts)
      : sidebarItems.filter((group) => !group.allowedRoles || group.allowedRoles.includes(userRole));

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href={isCrmStaff ? "/dashboard/crm" : "/dashboard/default"}>
                <Command />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredSidebarItems} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
