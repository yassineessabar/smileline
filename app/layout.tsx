import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/use-auth'
import { OnboardingProvider } from '@/hooks/use-onboarding'

export const metadata: Metadata = {
  title: 'Loop Review — Automate Reviews. Amplify Trust.',
  description: 'Collect and respond to reviews effortlessly with Loop Review. Automate feedback across WhatsApp, SMS, Email, Google, and Trustpilot. Boost reputation and engagement with AI-powered automation.',
  keywords: 'review automation, Trustpilot integration, Google reviews, WhatsApp reviews, SMS feedback, review management, AI reply to reviews, collect customer reviews, SaaS review platform',
  authors: [{ name: 'Loop Review' }],
  robots: 'index, follow',
  generator: 'Loop Review',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Switzer:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <OnboardingProvider>
            {children}
            <Toaster />
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
