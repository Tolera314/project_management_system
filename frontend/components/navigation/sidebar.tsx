"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Icons } from "@/components/icons"
import { DashboardNav } from "@/components/navigation/dashboard-nav"
import { navItems } from "@/config/nav"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus:ring-0 focus:ring-offset-0 md:hidden"
        >
          <Icons.menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col pr-0">
        <div className="px-4 py-4">
          <Link
            href="/"
            className="flex items-center space-x-2"
            onClick={() => setOpen(false)}
          >
            <Icons.logo className="h-6 w-6" />
            <span className="text-lg font-bold">ProjectOS</span>
          </Link>
        </div>
        <ScrollArea className="my-4 flex-1 px-3">
          <DashboardNav items={navItems} />
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Icons.user className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Guest User</p>
              <p className="text-xs text-muted-foreground truncate">guest@example.com</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icons.settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-background md:flex md:flex-col md:w-64">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="text-lg font-bold">ProjectOS</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        <DashboardNav items={navItems} />
      </div>
      <div className="border-t p-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
            <Icons.user className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Guest User</p>
            <p className="text-xs text-muted-foreground truncate">guest@example.com</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Icons.settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
