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
              <a className="text-sm text-gray-500 hover:text-gray-900">
                Terms
              </a>
            </Link>
            <Link href="/privacy">
              <a className="text-sm text-gray-500 hover:text-gray-900">
                Privacy
              </a>
            </Link>
            <Link href="/help">
              <a className="text-sm text-gray-500 hover:text-gray-900">
                Help
              </a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
