import {
  BarChart3,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  ListTodo,
  Lock,
  type LucideIcon,
  MapPin,
  ReceiptText,
  Shield,
  StickyNote,
  Users,
  Workflow,
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
  badge?: number;
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
        title: "Overview",
        url: "/dashboard/crm",
        icon: LayoutDashboard,
      },
      {
        title: "Notes",
        url: "/dashboard/crm/notes",
        icon: StickyNote,
      },
      {
        title: "Tasks",
        url: "/dashboard/crm/tasks",
        icon: ListTodo,
      },
      {
        title: "Opportunities",
        url: "/dashboard/crm/opportunities",
        icon: DollarSign,
      },
      {
        title: "Workflows",
        url: "/dashboard/crm/workflows",
        icon: Workflow,
      },
    ],
  },
  {
    id: 3,
    label: "General Info",
    allowedRoles: ["admin", "advisor"],
    items: [
      {
        title: "Clients",
        url: "/dashboard/crm/clients",
        icon: Briefcase,
      },
      {
        title: "Households",
        url: "/dashboard/crm/households",
        icon: Home,
      },
      {
        title: "Companies",
        url: "/dashboard/crm/companies",
        icon: Building2,
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
        title: "Policies",
        url: "/dashboard/crm/policies",
        icon: FileText,
      },
    ],
  },
  {
    id: 4,
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
        title: "Property And Casualty",
        url: "/dashboard/crm/property-and-casualty",
        icon: Shield,
      },
      {
        title: "Money Managers",
        url: "/dashboard/admin/money-managers",
        icon: Shield,
      },
      {
        title: "Record Keepers",
        url: "/dashboard/admin/record-keepers",
        icon: Shield,
      },
    ],
  },
  {
    id: 5,
    label: "Professional Services",
    allowedRoles: ["admin", "advisor"],
    items: [
      {
        title: "Accounting Firms",
        url: "/dashboard/crm/accounting-firms",
        icon: ReceiptText,
      },
      {
        title: "Insurance Agencies",
        url: "/dashboard/crm/insurance-agencies",
        icon: Shield,
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
    ],
  },
  {
    id: 6,
    allowedRoles: ["admin", "advisor"],
    items: [
      {
        title: "Report Center",
        url: "/dashboard/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    id: 7,
    allowedRoles: ["admin"],
    items: [
      {
        title: "Admin Settings",
        url: "/dashboard/admin",
        icon: Lock,
      },
    ],
  },
];
