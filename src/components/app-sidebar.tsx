"use client"

import type * as React from "react"
import { Building2, MapPin, GalleryVerticalEnd, Globe, MessageSquare } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Demo Franchisor",
    email: "admin@demofranchise.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Demo Franchise Co",
      logo: GalleryVerticalEnd,
      plan: "Franchisor Portal",
    },
  ],
  navMain: [
    // {
    //   title: "Properties",
    //   url: "/properties",
    //   icon: Building2,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "All Properties",
    //       url: "/properties",
    //     },
    //   ],
    // },
    {
      title: "Markets",
      url: "/markets",
      icon: MapPin,
      isActive: true,
      items: [
        {
          title: "All Markets",
          url: "/markets",
        },
      ],
    },

    // {
    //   title: "Map",
    //   url: "/map",
    //   icon: Globe,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "Interactive Map",
    //       url: "/map",
    //     },
    //   ],
    // },
    // {
    //   title: "Chat",
    //   url: "/chat",
    //   icon: MessageSquare,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "All Chat",
    //       url: "/chat",
    //     },
    //     {
    //       title: "Weekly Updates",
    //       url: "/chat/weekly-updates",
    //     },
    //   ],
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} suppressHydrationWarning>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Demo Franchise Co</span>
                <span className="truncate text-xs">Franchisor Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
