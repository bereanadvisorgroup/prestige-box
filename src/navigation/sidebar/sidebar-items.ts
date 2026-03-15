import {
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  ChartBar,
  DollarSign,
  FileText,
  Fingerprint,
  Forklift,
  Gauge,
  GraduationCap,
  Home,
  Kanban,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Mail,
  MapPin,
  MessageSquare,
  ReceiptText,
  Shield,
  ShoppingBag,
  SquareArrowUpRight,
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
  allowedRoles?: string[]; // E.g., ['admin', 'employee', 'client']
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
    allowedRoles: ["admin", "employee"],
    items: [
      {
        title: "CRM Pipeline",
        url: "/dashboard/crm-pipeline",
        icon: LayoutDashboard,
      },
      {
        title: "Finance",
        url: "/dashboard/finance",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 3,
    label: "CRM Tools",
    allowedRoles: ["admin", "employee"],
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
      {
        title: "Payments",
        url: "/dashboard/crm/payments",
        icon: DollarSign,
      },
    ],
  },
  {
    id: 4,
    label: "Admin Settings",
    allowedRoles: ["admin"],
    items: [
      {
        title: "Insurance Companies",
        url: "/dashboard/admin/insurance-companies",
        icon: Shield,
      },
      {
        title: "Manage Users",
        url: "/dashboard/admin/users",
        icon: Lock,
      },
    ],
  },
];
