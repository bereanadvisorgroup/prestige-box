import {
  Banknote,
  Calendar,
  ChartBar,
  Fingerprint,
  Forklift,
  Gauge,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  ReceiptText,
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
    label: "CRM Tools",
    allowedRoles: ["admin", "employee"],
    items: [
      {
        title: "Overview",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        title: "Client Pipeline",
        url: "/dashboard/crm",
        icon: Users,
      },
      {
        title: "Finance",
        url: "/dashboard/finance",
        icon: Banknote,
      },
    ],
  },
  {
    id: 3,
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
