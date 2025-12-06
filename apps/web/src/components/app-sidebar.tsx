import { CloudSun, Users, Rocket, LogOut, ChevronUp } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { logout } from "@/lib/auth/authApi";
import { getCurrentUser } from "@/lib/auth/authStorage";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  {
    title: "Clima",
    url: "/clima",
    icon: CloudSun,
  },
  {
    title: "Usuários",
    url: "/users",
    icon: Users,
    requiresAdmin: true as const,
  },
  {
    title: "Naves",
    url: "/ships",
    icon: Rocket,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  }

  const visibleItems = items.filter((item) => {
    if (item.requiresAdmin && user?.role !== "admin") {
      return false;
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CloudSun className="size-4" />
          </div>
          <span className="truncate font-semibold">Dashboard Climático</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Aplicações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "US"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name ?? "Usuário"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email ?? "email@email.com"}
                    </span>
                  </div>

                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-500 cursor-pointer focus:text-red-500"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Sair da conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
