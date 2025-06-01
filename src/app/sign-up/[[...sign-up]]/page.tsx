import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Join Us
          </h1>
          <p className="text-gray-400 mt-2">
            Create an account to start generating English worksheets
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}