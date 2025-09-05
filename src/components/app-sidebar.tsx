"use client"

import type * as React from "react"
import { Building2, MapPin, GalleryVerticalEnd, Globe, MessageSquare } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

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
    {
      title: "Properties",
      url: "/properties",
      icon: Building2,
      isActive: true,
      items: [
        {
          title: "All Properties",
          url: "/properties",
        },
      ],
    },
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
        <TeamSwitcher teams={data.teams} />
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
