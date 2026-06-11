import {
  Briefcase,
  Building2,
  DollarSign,
  FileText,
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
        title: "Benefit Payments",
        url: "/dashboard/crm/payments",
        icon: DollarSign,
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
        title: "Accounting Firms",
        url: "/dashboard/crm/accounting-firms",
        icon: ReceiptText,
      },
      {
        title: "Actuarial Firms",
        url: "/dashboard/crm/actuarial-firms",
        icon: ReceiptText,
      },
      {
        title: "Banks",
        url: "/dashboard/crm/banks",
        icon: Building2,
      },
      {
        title: "Law Firms",
        url: "/dashboard/crm/law-firms",
        icon: Building2,
      },
      {
        title: "Property And Casualty",
        url: "/dashboard/crm/property-and-casualty",
        icon: Shield,
      },
    ],
  },
  {
    id: 5,
    label: "Vendors",
    allowedRoles: ["admin"],
    items: [
      {
        title: "Life Insurance",
        url: "/dashboard/admin/life-insurance-companies",
        icon: Shield,
      },
      {
        title: "Disability Insurance",
        url: "/dashboard/admin/disability-insurance-companies",
        icon: Shield,
      },
      {
        title: "Long Term Care",
        url: "/dashboard/admin/long-term-care-insurance",
        icon: Shield,
      },
      {
        title: "Money Managers",
        url: "/dashboard/admin/money-managers",
        icon: Shield,
      },
    ],
  },
  {
    id: 6,
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
