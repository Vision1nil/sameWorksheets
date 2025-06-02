"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap } from "lucide-react";
import { AuthButton } from "@/components/AuthButton";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold glow-text">EduSheet AI</h1>
                <p className="text-sm text-muted-foreground">AI-Powered English Worksheet Generator</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="tech-border">
              <Zap className="h-3 w-3 mr-1" />
              K-12 Ready
            </Badge>
            <div className="flex items-center gap-2">
              <Navigation currentPath={pathname} />
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Navigation({ currentPath }: { currentPath: string }) {
  return (
    <nav className="hidden md:flex items-center gap-2">
      <Link href="/generate">
        <Button 
          variant={currentPath === "/generate" ? "default" : "outline"} 
          size="sm"
          className={currentPath === "/generate" ? "glow-border" : "bg-white/5 border-white/20 text-white hover:bg-white/10"}
        >
          Create Worksheet
        </Button>
      </Link>
      <Link href="/worksheets">
        <Button 
          variant={currentPath === "/worksheets" ? "default" : "outline"} 
          size="sm"
          className={currentPath === "/worksheets" ? "glow-border" : "bg-white/5 border-white/20 text-white hover:bg-white/10"}
        >
          My Worksheets
        </Button>
      </Link>
      <Link href="/dashboard">
        <Button 
          variant={currentPath === "/dashboard" ? "default" : "outline"} 
          size="sm"
          className={currentPath === "/dashboard" ? "glow-border" : "bg-white/5 border-white/20 text-white hover:bg-white/10"}
        >
          Dashboard
        </Button>
      </Link>
    </nav>
  );
}
