"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { navItems } from "@/config/nav"

interface DashboardNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string
    href: string
    icon: keyof typeof Icons
  }[]
}

export function DashboardNav({ className, items, ...props }: DashboardNavProps) {
  const pathname = usePathname()

  if (!items?.length) {
    return null
  }

  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
      {items.map((item, index) => {
        const Icon = Icons[item.icon as keyof typeof Icons] || Icons["dashboard"]
        const isActive = pathname === item.href

        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
