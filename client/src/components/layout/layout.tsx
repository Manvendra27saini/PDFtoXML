import React, { ReactNode, useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import Footer from "./footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleMobileSidebar={toggleMobileSidebar} />
      <main className="flex-grow flex">
        <Sidebar isMobileOpen={isMobileSidebarOpen} closeMobileSidebar={() => setIsMobileSidebarOpen(false)} />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Mobile menu button - only visible on mobile */}
            <div className="md:hidden flex items-center mb-4">
              <button 
                type="button" 
                onClick={toggleMobileSidebar}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <i className="ri-menu-line text-2xl"></i>
              </button>
              <span className="ml-2 text-xl font-semibold text-gray-900">Convert Files</span>
            </div>
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
