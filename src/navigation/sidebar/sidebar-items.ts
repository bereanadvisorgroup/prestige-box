import {
  Briefcase,
  Building2,
  DollarSign,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  MapPin,
  ReceiptText,
  Shield,
  Users,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
  allowedRoles?: string[]; // E.g., ['admin', 'advisor', 'client']
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Client Portal",
    allowedRoles: ["client"],
    items: [
      {
        title: "My Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Dashboards",
    allowedRoles: ["admin", "advisor"],
    items: [
      {
        title: "Payments",
        url: "/dashboard/crm/payments",
        icon: DollarSign,
      },
      {
        title: "DEMO CRM Pipeline",
        url: "/dashboard/crm-pipeline",
        icon: LayoutDashboard,
      },
      {
        title: "DEMO Finance",
        url: "/dashboard/finance",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 3,
    label: "General Info",
    allowedRoles: ["admin", "advisor"],
    items: [
      {
        title: "Overview",
        url: "/dashboard/crm",
        icon: LayoutDashboard,
      },
      {
        title: "People",
        url: "/dashboard/crm/people",
        icon: Users,
      },
      {
        title: "Addresses",
        url: "/dashboard/crm/addresses",
        icon: MapPin,
      },
      {
        title: "Households",
        url: "/dashboard/crm/households",
        icon: Home,
      },
      {
        title: "Clients",
        url: "/dashboard/crm/clients",
        icon: Briefcase,
      },
      {
        title: "Companies",
        url: "/dashboard/crm/companies",
        icon: Building2,
      },
      {
        title: "Policies",
        url: "/dashboard/crm/policies",
        icon: FileText,
      },
    ],
  },
  {
    id: 4,
    label: "Professional Services",
    allowedRoles: ["admin", "advisor"],
    items: [
      {
        title: "Lawyers",
        url: "/dashboard/crm/lawyers",
        icon: GraduationCap,
      },
      {
        title: "Accountants",
        url: "/dashboard/crm/accountants",
        icon: ReceiptText,
      },
      {
        title: "Insurance",
        url: "/dashboard/admin/insurance-companies",
        icon: Shield,
      },
    ],
  },
  {
    id: 5,
    label: "Admin Settings",
    allowedRoles: ["admin"],
    items: [
      {
        title: "Manage Users",
        url: "/dashboard/admin/users",
        icon: Lock,
      },
    ],
  },
];
