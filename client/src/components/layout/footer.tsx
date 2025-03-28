import React from "react";
import { Link } from "wouter";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PDFtoXML. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link href="/terms">
              <div className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">
                Terms
              </div>
            </Link>
            <Link href="/privacy">
              <div className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">
                Privacy
              </div>
            </Link>
            <Link href="/help">
              <div className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">
                Help
              </div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
