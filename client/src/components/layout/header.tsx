import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  toggleMobileSidebar: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const [user, setUser] = useState<User | null>(null);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
          variant: "default",
        });
        
        // Redirect to login page
        navigate('/auth');
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
      console.error('Error during logout:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "G";
    
    const nameParts = user.username.split(/[ -]/);
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <i className="ri-file-transfer-line text-primary text-2xl mr-2"></i>
                <span className="text-xl font-bold text-gray-900">PDFtoXML</span>
              </div>
            </Link>
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-gray-100 rounded-full p-1 text-gray-500 hover:text-gray-700 focus:outline-none">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500">
                  <span>{getUserInitials()}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  Your Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
