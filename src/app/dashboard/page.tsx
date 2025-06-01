import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to main page - the dashboard functionality is on the main page
  redirect('/')
}