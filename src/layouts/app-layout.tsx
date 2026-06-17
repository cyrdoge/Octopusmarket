import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export type AppLayoutVariant = "default" | "fullscreen" | "minimal";

export type AppLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  navigation?: ReactNode;
  variant?: AppLayoutVariant;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
};

/**
 * App layout - Main application shell with header, navigation, and content area
 */
export function AppLayout({
  children,
  header,
  navigation,
  variant = "default",
  sidebarOpen: controlledOpen,
  onSidebarOpenChange,
}: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true);

  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onSidebarOpenChange || setUncontrolledOpen;

  if (variant === "fullscreen") {
    return <main className="w-full">{children}</main>;
  }

  if (variant === "minimal") {
    return (
      <div className="flex h-screen flex-col">
        {header && <header className="border-b bg-card">{header}</header>}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {navigation && (
        <>
          {/* Mobile overlay */}
          {isMobile && isOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar
              transition-transform duration-300 ease-in-out
              lg:relative lg:translate-x-0
              ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""}
            `}
          >
            {navigation}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3">
          {isMobile && navigation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!isOpen)}
              className="lg:hidden"
            >
              {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          )}
          {header && <div className="flex-1">{header}</div>}
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
