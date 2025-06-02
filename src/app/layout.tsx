import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Worksheet Generator",
  description: "AI-powered English worksheets for K-12 students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#000000',
          colorInputBackground: '#1a1a1a',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#a3a3a3',
          colorShimmer: '#1a1a1a',
          colorNeutral: '#404040',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300',
          card: 'bg-black/90 border border-white/10 backdrop-blur-md shadow-2xl',
          headerTitle: 'text-white font-bold',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all duration-300',
          formFieldInput: 'bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20',
          footerActionLink: 'text-blue-400 hover:text-blue-300',
          formFieldLabel: 'text-gray-300',
          dividerLine: 'bg-white/20',
          dividerText: 'text-gray-400',
          formHeaderTitle: 'text-white',
          formHeaderSubtitle: 'text-gray-400',
          alertText: 'text-red-400',
          formFieldErrorText: 'text-red-400',
          identityPreviewEditButton: 'text-blue-400 hover:text-blue-300',
          userButtonAvatarBox: 'border-2 border-white/20 shadow-lg',
          userButtonBox: 'shadow-lg',
          userButtonPopoverCard: 'bg-black/95 border border-white/10 backdrop-blur-md shadow-2xl',
          userButtonPopoverActionButton: 'text-white hover:bg-white/10',
          userButtonPopoverFooter: 'border-t border-white/10',
        }
      }}
    >
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body suppressHydrationWarning className="antialiased min-h-screen flex flex-col bg-background grid-pattern">
          <ClientBody>{children}</ClientBody>
        </body>
      </html>
    </ClerkProvider>
  );
}
