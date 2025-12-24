import { Icons } from "@/components/icons"

export type NavItem = {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
  label?: string
  description?: string
  items?: NavItem[]
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    items: [],
  },
  {
    title: "Projects",
    href: "/projects",
    icon: "projects",
    items: [],
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: "tasks",
    items: [],
  },
  {
    title: "Team",
    href: "/team",
    icon: "team",
    items: [],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "settings",
    items: [],
  },
]
