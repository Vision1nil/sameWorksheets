"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, FileText, BarChart3, User } from "lucide-react";

interface NavigationProps {
  currentPath: string;
}

export function Navigation({ currentPath }: NavigationProps) {
  const [open, setOpen] = useState(false);
  
  const navItems = [
    { href: "/", label: "Home", icon: <Home className="h-5 w-5 mr-2" /> },
    { href: "/generate", label: "Create Worksheet", icon: <FileText className="h-5 w-5 mr-2" /> },
    { href: "/worksheets", label: "My Worksheets", icon: <FileText className="h-5 w-5 mr-2" /> },
    { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="h-5 w-5 mr-2" /> },
    { href: "/profile", label: "Profile", icon: <User className="h-5 w-5 mr-2" /> },
  ];
  
  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-2">
        {navItems.slice(1, 4).map((item) => (
          <Link key={item.href} href={item.href}>
            <Button 
              variant={currentPath === item.href ? "default" : "outline"} 
              size="sm"
              className={currentPath === item.href 
                ? "glow-border" 
                : "bg-white/5 border-white/20 text-white hover:bg-white/10"}
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/5 border-white/20">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-black/90 border-white/10">
            <div className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <Button 
                    variant={currentPath === item.href ? "default" : "ghost"} 
                    className={`w-full justify-start ${
                      currentPath === item.href 
                        ? "bg-primary text-primary-foreground" 
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
