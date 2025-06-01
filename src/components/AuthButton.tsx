'use client'

import { UserButton, useUser, SignInButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { User, Settings, LogIn } from 'lucide-react'
import Link from 'next/link'

export function AuthButton() {
  const { isSignedIn, user } = useUser()

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </SignInButton>
        <Link href="/sign-up">
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Sign Up
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex flex-col items-end">
        <span className="text-white text-sm font-medium">
          {user?.firstName || user?.username || 'User'}
        </span>
        <span className="text-gray-400 text-xs">
          {user?.primaryEmailAddress?.emailAddress}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Link href="/profile">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
        
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 border-2 border-white/20 shadow-lg",
            }
          }}
        />
      </div>
    </div>
  )
}