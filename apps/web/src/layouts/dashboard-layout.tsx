import { Outlet, useLocation } from "react-router-dom"; // Importe useLocation
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";

const titleMap: { [key: string]: string } = {
  "/clima": "Clima",
  "/users": "Usuários",
  "/ships": "Naves",
};

export function DashboardLayout() {
  const location = useLocation();

  const currentTitle = titleMap[location.pathname] || "Dashboard";

  return (
    <SidebarProvider className="h-full">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            <h1 className="text-lg font-semibold leading-none tracking-tight">
              {currentTitle}
            </h1>
          </div>

          {/* Parte DIREITA: Botão de Tema */}
          <div className="flex items-center">
            <ModeToggle />
          </div>
        </header>

        {/* Área onde as páginas (Clima, Usuários, etc.) serão renderizadas */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
