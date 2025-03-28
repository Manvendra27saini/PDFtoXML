import React from "react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, closeMobileSidebar }) => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
    { path: "/convert", label: "Convert Files", icon: "ri-file-transfer-line" },
    { path: "/history", label: "Conversion History", icon: "ri-history-line" },
    { path: "/settings", label: "Settings", icon: "ri-settings-4-line" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Desktop sidebar
  const DesktopSidebar = (
    <div className="bg-white shadow-sm w-64 hidden md:block">
      <div className="h-full flex flex-col">
        <nav className="mt-5 flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                isActive(item.path)
                  ? "text-primary bg-blue-50"
                  : "text-gray-900 hover:bg-gray-100"
              }`}
            >
              <i className={`${item.icon} mr-3 ${isActive(item.path) ? "text-primary" : "text-gray-500"}`}></i>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 mb-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="ri-information-line text-blue-500"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Pro Tip</h3>
                <div className="mt-2 text-sm text-blue-700">
                  Batch convert multiple PDFs by selecting several files at once.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile sidebar
  const MobileSidebar = (
    <div
      className={`fixed inset-0 z-40 md:hidden ${
        isMobileOpen ? "block" : "hidden"
      }`}
    >
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            onClick={closeMobileSidebar}
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <i className="ri-close-line text-white text-2xl"></i>
          </button>
        </div>
        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMobileSidebar}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  isActive(item.path)
                    ? "text-primary bg-blue-50"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                <i className={`${item.icon} mr-3 ${isActive(item.path) ? "text-primary" : "text-gray-500"}`}></i>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
    </>
  );
};

export default Sidebar;
