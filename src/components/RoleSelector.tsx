'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserCheck, GraduationCap, Settings } from 'lucide-react'
import { setUserRole } from '@/lib/database'

interface RoleSelectorProps {
  userId: string
  onRoleSelected: (role: 'student' | 'teacher') => void
}

export function RoleSelector({ userId, onRoleSelected }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const roles = [
    {
      id: 'student' as const,
      title: 'Student',
      description: 'Access worksheets, track progress, and complete assignments',
      icon: <GraduationCap className="h-8 w-8" />,
      features: [
        'Generate custom worksheets',
        'Track learning progress',
        'Join teacher classrooms',
        'Complete assignments',
        'View performance analytics'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'teacher' as const,
      title: 'Teacher',
      description: 'Create classrooms, assign worksheets, and track student progress',
      icon: <UserCheck className="h-8 w-8" />,
      features: [
        'Create and manage classrooms',
        'Assign worksheets to students',
        'Track student progress',
        'Generate class reports',
        'Customize worksheet difficulty'
      ],
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const handleRoleSelection = async (role: 'student' | 'teacher') => {
    setIsLoading(true)
    try {
      await setUserRole(userId, role)
      onRoleSelected(role)
    } catch (error) {
      console.error('Error setting user role:', error)
      alert('Error setting role. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Choose Your Role
          </h1>
          <p className="text-gray-400 text-lg">
            Select how you'll be using EduSheet AI to get the best experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roles.map((role) => (
            <Card 
              key={role.id}
              className={`relative cursor-pointer transition-all duration-300 bg-black/50 border-white/10 hover:border-white/30 ${
                selectedRole === role.id ? 'ring-2 ring-blue-500 border-blue-500/50' : ''
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardHeader className="text-center">
                <div className={`mx-auto p-4 rounded-xl bg-gradient-to-r ${role.color} text-white mb-4`}>
                  {role.icon}
                </div>
                <CardTitle className="text-2xl text-white">{role.title}</CardTitle>
                <CardDescription className="text-gray-400">
                  {role.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {selectedRole === role.id && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRoleSelection(role.id)
                    }}
                    disabled={isLoading}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Continue as {role.title}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            You can change your role later in your profile settings
          </p>
        </div>
      </div>
    </div>
  )
}