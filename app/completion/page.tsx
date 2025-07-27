"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { User, MoreHorizontal, Star, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { templates, getTemplateById } from "@/data/templates"
import { Template } from "@/types/templates"
import { useAuth } from "@/hooks/use-auth"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function CompletionPage() {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()
  const { data, submitOnboarding, isSubmitting } = useOnboarding()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [companyName, setCompanyName] = useState("My Company")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [companyLinks, setCompanyLinks] = useState<string[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    // Load data from onboarding context
    if (data.companyProfile?.profileImage) {
      setProfileImage(data.companyProfile.profileImage)
    }

    if (data.companyProfile?.displayName) {
      setCompanyName(data.companyProfile.displayName)
    } else if (data.companyName) {
      setCompanyName(data.companyName)
    } else if (user?.company) {
      setCompanyName(user.company)
    }

    if (data.selectedTemplate && data.selectedTemplate !== 'default') {
      const template = getTemplateById(data.selectedTemplate)
      setSelectedTemplate(template || null)
    }

    if (data.selectedPlatforms) {
      setSelectedPlatforms(data.selectedPlatforms)
    }

    // Convert platform links to array for display
    if (data.platformLinks) {
      const links = Object.entries(data.platformLinks)
        .filter(([_, url]) => url.trim() !== "")
        .map(([platform, url]) => `${platform}: ${url}`)
      setCompanyLinks(links)
    }
  }, [data, user])

  const handleContinue = async () => {
    )
    const success = await submitOnboarding()

    if (success) {
      // Set flag to trigger auto-save in review-link tab
      sessionStorage.setItem('completion_redirect', 'true')
      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.replace('/?tab=review-link')
    } else {
      // Even if save fails, proceed to dashboard
      sessionStorage.setItem('onboarding_completed', 'true')
      // Set flag to trigger auto-save in review-link tab
      sessionStorage.setItem('completion_redirect', 'true')
      ')
      await new Promise(resolve => setTimeout(resolve, 1000))
      ...')
      router.replace('/?tab=review-link')
    }
  }

  // Get exact template styling based on specific template designs
  const getTemplateStyles = (template: Template | null) => {
    if (!template) {
      return {
        backgroundStyle: { backgroundColor: '#F0EDE8' },
        containerClasses: 'bg-[#F0EDE8]',
        nameClasses: 'text-2xl font-bold text-gray-800',
        bioClasses: 'text-sm text-gray-600',
        buttonClasses: 'bg-white border border-gray-200 text-gray-800 rounded-lg shadow-sm',
        profileImageClasses: 'w-32 h-32 rounded-full bg-gray-300'
      }
    }

    switch (template.id) {
      // Business Templates
      case 'b-01': // Emmy - Clean and professional
        return {
          backgroundStyle: { backgroundColor: '#FFFFFF' },
          containerClasses: 'bg-white',
          nameClasses: 'text-2xl font-bold text-gray-900',
          bioClasses: 'text-sm text-gray-600',
          buttonClasses: 'bg-white border border-gray-200 text-gray-800 rounded-xl shadow-sm hover:bg-gray-50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-gray-200 border-2 border-white shadow-lg'
        }

      case 'b-02': // Holly - Modern with vibrant colors
        return {
          backgroundStyle: {
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
          },
          containerClasses: 'text-white',
          nameClasses: 'text-2xl font-bold text-white',
          bioClasses: 'text-sm text-white/80',
          buttonClasses: 'bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/30',
          profileImageClasses: 'w-32 h-32 rounded-full bg-white/20 border-2 border-white/50'
        }

      case 'b-03': // Lexie Classic - Elegant styling
        return {
          backgroundStyle: { backgroundColor: '#FEFDFB' },
          containerClasses: 'bg-[#FEFDFB]',
          nameClasses: 'text-2xl font-bold text-slate-800 font-serif',
          bioClasses: 'text-sm text-slate-600',
          buttonClasses: 'bg-white border border-amber-600 text-slate-800 rounded-lg shadow-sm hover:bg-amber-50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-amber-100 border-2 border-amber-600'
        }

      // Creative Templates
      case 'c-06': // Tatiana - Bold and artistic
        return {
          backgroundStyle: {
            background: 'linear-gradient(45deg, #000000 0%, #4C1D95 50%, #FF1493 100%)'
          },
          containerClasses: 'text-white',
          nameClasses: 'text-3xl font-bold text-white tracking-wide',
          bioClasses: 'text-sm text-pink-200',
          buttonClasses: 'bg-gradient-to-r from-pink-500 to-cyan-400 text-white rounded-full border-2 border-pink-400 shadow-lg hover:shadow-pink-500/50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-cyan-400 border-4 border-pink-300'
        }

      case 'c-04': // Salka - Unique and expressive
        return {
          backgroundStyle: {
            background: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 50%, #FCD34D 100%)'
          },
          containerClasses: 'text-white',
          nameClasses: 'text-2xl font-bold text-yellow-100',
          bioClasses: 'text-sm text-orange-200',
          buttonClasses: 'bg-yellow-400/80 text-orange-900 rounded-2xl border-2 border-yellow-300 font-medium hover:bg-yellow-300',
          profileImageClasses: 'w-32 h-32 rounded-full bg-yellow-400 border-4 border-yellow-300'
        }

      // Minimal Templates
      case 'm-03': // Kevin - Clean and simple
        return {
          backgroundStyle: { backgroundColor: '#FFFFFF' },
          containerClasses: 'bg-white',
          nameClasses: 'text-2xl font-medium text-black',
          bioClasses: 'text-sm text-gray-600',
          buttonClasses: 'bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-gray-100 border border-gray-300'
        }

      case 'm-01': // Ella - Pure minimal
        return {
          backgroundStyle: { backgroundColor: '#FFFFFF' },
          containerClasses: 'bg-white',
          nameClasses: 'text-2xl font-normal text-black',
          bioClasses: 'text-sm text-gray-500',
          buttonClasses: 'bg-white border border-gray-200 text-black rounded-md hover:border-gray-400',
          profileImageClasses: 'w-32 h-32 rounded-full bg-gray-50'
        }

      case 'm-06': // Natazia - Elegant minimal
        return {
          backgroundStyle: { backgroundColor: '#FAFAFA' },
          containerClasses: 'bg-gray-50',
          nameClasses: 'text-2xl font-light text-gray-900',
          bioClasses: 'text-sm text-gray-600',
          buttonClasses: 'bg-white border border-sage-300 text-gray-800 rounded-xl hover:bg-sage-50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-sage-100 border border-sage-200'
        }

      // Personal Templates
      case 'p-01': // Gabrielle Classic - Warm and friendly
        return {
          backgroundStyle: { backgroundColor: '#FEF7F0' },
          containerClasses: 'bg-orange-50',
          nameClasses: 'text-2xl font-semibold text-orange-900',
          bioClasses: 'text-sm text-orange-700',
          buttonClasses: 'bg-white border border-orange-200 text-orange-800 rounded-xl shadow-sm hover:bg-orange-50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-orange-100 border-2 border-orange-200'
        }

      case 'p-03': // Georgianna - Elegant personal
        return {
          backgroundStyle: { backgroundColor: '#F8FAFC' },
          containerClasses: 'bg-slate-50',
          nameClasses: 'text-2xl font-serif font-medium text-slate-800',
          bioClasses: 'text-sm text-slate-600',
          buttonClasses: 'bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-slate-100 border-2 border-slate-300'
        }

      case 'p-04': // Gibby - Fun and playful
        return {
          backgroundStyle: {
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #F59E0B 100%)'
          },
          containerClasses: 'text-orange-900',
          nameClasses: 'text-3xl font-bold text-orange-900',
          bioClasses: 'text-sm text-orange-700',
          buttonClasses: 'bg-white/90 text-orange-800 rounded-full border-2 border-orange-300 font-medium hover:bg-white',
          profileImageClasses: 'w-32 h-32 rounded-full bg-yellow-300 border-4 border-orange-300'
        }

      // Restaurant Templates
      case 'r-06': // Restaurant Oyster - Fine dining
        return {
          backgroundStyle: { backgroundColor: '#7C2D12' },
          containerClasses: 'bg-red-900 text-amber-100',
          nameClasses: 'text-2xl font-serif font-bold text-amber-100',
          bioClasses: 'text-sm text-amber-200',
          buttonClasses: 'bg-amber-100 text-red-900 rounded-lg font-medium hover:bg-amber-200',
          profileImageClasses: 'w-32 h-32 rounded-full bg-amber-200 border-2 border-amber-400'
        }

      case 'r-05': // Restaurant Morning Dough - Cafe/bakery
        return {
          backgroundStyle: { backgroundColor: '#78350F' },
          containerClasses: 'bg-amber-900 text-amber-100',
          nameClasses: 'text-2xl font-semibold text-amber-100',
          bioClasses: 'text-sm text-amber-200',
          buttonClasses: 'bg-amber-100 text-amber-900 rounded-xl font-medium hover:bg-amber-50',
          profileImageClasses: 'w-32 h-32 rounded-full bg-amber-200 border-2 border-amber-300'
        }

      // Default case for other templates
      default:
        return {
          backgroundStyle: { backgroundColor: '#F0EDE8' },
          containerClasses: 'bg-[#F0EDE8]',
          nameClasses: 'text-2xl font-bold text-gray-800',
          bioClasses: 'text-sm text-gray-600',
          buttonClasses: 'bg-white border border-gray-200 text-gray-800 rounded-lg shadow-sm',
          profileImageClasses: 'w-32 h-32 rounded-full bg-gray-300'
        }
    }
  }

  const templateStyles = getTemplateStyles(selectedTemplate)

  // Loop Review app mockup that matches the actual interface
  const LoopReviewPreview = ({ companyName, profileImage }: {
    companyName: string,
    profileImage: string | null
  }) => {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 space-y-8">
        {/* Company Logo/Profile */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-gray-400" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
        </div>

        {/* Main Question */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            How was your experience with {companyName}?
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed px-4">
            We'd love to hear about your experience with our service.
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="transform transition-transform duration-200">
              <Star
                className={`h-10 w-10 transition-all duration-300 ${
                  star <= 4
                    ? "text-yellow-400 fill-yellow-400 drop-shadow-sm"
                    : "text-gray-300 fill-gray-300"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Review Platforms */}
        <div className="w-full space-y-3 px-4 max-w-xs">
          <div className="w-full bg-white border border-gray-200 rounded-full py-3 px-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="text-gray-800 font-medium text-sm">Leave Google Review</span>
            </div>
          </div>

          <div className="w-full bg-white border border-gray-200 rounded-full py-3 px-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center space-x-2">
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="text-gray-800 font-medium text-sm">Visit Website</span>
            </div>
          </div>
        </div>

        {/* Powered by Loop Review */}
        <div className="mt-auto pt-6">
          <p className="text-xs text-gray-400 text-center">
            Powered by <span className="font-semibold text-gray-600">Loop Review</span>
          </p>
        </div>
      </div>
    )
  }

  // Individual template components that match exact designs
  const TemplatePreview = ({ template, companyName, profileImage, companyLinks }: {
    template: Template | null,
    companyName: string,
    profileImage: string | null,
    companyLinks: string[]
  }) => {
    // Always show Loop Review interface for completion page
    return <LoopReviewPreview companyName={companyName} profileImage={profileImage} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-violet-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <main className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Confetti Animation */}
      <div className="confetti-container pointer-events-none absolute inset-0 z-0">
        {Array.from({ length: 500 }).map((_, i) => {
          // Use deterministic values based on index to avoid hydration mismatches
          const seed = i * 17; // Simple seed based on index
          const xDirection = ((seed * 7) % 200) / 100 - 1; // -1 to 1
          const yDirection = ((seed * 13) % 200) / 100 - 1; // -1 to 1
          const animationDuration = ((seed * 19) % 120) / 100 + 0.8; // 0.8s to 2s
          const animationDelay = ((seed * 23) % 30) / 100; // 0s to 0.3s

          return (
            <div
              key={i}
              className="confetti absolute rounded-full opacity-0"
              style={{
                // Deterministic starting position near the center
                left: `calc(50% + ${((seed * 29) % 150) - 75}px)`,
                top: `calc(50% + ${((seed * 31) % 150) - 75}px)`,
                width: `${((seed * 37) % 8) + 4}px`,
                height: `${((seed * 41) % 8) + 4}px`,
                backgroundColor: `hsl(${(seed * 43) % 360}, 80%, 65%)`,
                animationDelay: `${animationDelay}s`,
                animationDuration: `${animationDuration}s`,
                animationFillMode: "forwards",
                animationName: "explode",
                // CSS custom properties for the explosion direction
                '--x-direction': xDirection,
                '--y-direction': yDirection,
              } as React.CSSProperties}
            />
          )
        })}
      </div>

      {/* Header */}
      <header className="flex items-center justify-center p-6 border-b border-gray-200 relative z-10">
        <div className="h-1 w-full max-w-xs bg-gray-200 rounded-full">
          <div className="h-full w-full bg-[#8A2BE2] rounded-full" /> {/* Full progress */}
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 py-8 px-6 lg:px-12 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">Looking good!</h1>
          <p className="text-lg text-gray-600">
            Your Linktree is off to a great start. Continue building to make it even better.
          </p>
        </div>

        {/* Phone Mockup with Template Preview */}
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-[420px] h-[680px] bg-white rounded-[45px] shadow-2xl border-[8px] border-white flex flex-col overflow-hidden">
            {/* Phone Top Bar */}
            <div className="h-8 bg-white flex items-center justify-center relative">
              <div className="w-24 h-1 bg-gray-800 rounded-full" />
            </div>

            {/* Template Content */}
            <div className="flex-1 overflow-hidden">
              <TemplatePreview
                template={selectedTemplate}
                companyName={companyName}
                profileImage={profileImage}
                companyLinks={companyLinks}
              />
            </div>

            {/* Phone Bottom Bar */}
            <div className="h-6 bg-white" />
          </div>
        </div>
      </section>

      {/* Continue button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white shadow-lg z-10 lg:px-14 lg:py-12 md:bg-transparent md:bg-gradient-to-t md:from-white md:via-white/90 md:to-transparent">
        <div className="w-full max-w-lg mx-auto">
          <Button
            onClick={handleContinue}
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl font-semibold text-lg bg-[#8A2BE2] text-white hover:bg-[#7a24cc] shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Completing setup...</span>
              </div>
            ) : (
              "Continue building this Loop"
            )}
          </Button>
        </div>
      </div>

      {/* Completion Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-10 max-w-sm mx-4 text-center shadow-2xl border border-gray-100 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-3xl"></div>

            {/* Floating dots */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-black/10 rounded-full animate-float"
                  style={{
                    left: `${(i * 23) % 100}%`,
                    top: `${(i * 31) % 100}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: `${4 + (i % 2)}s`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {/* Minimal spinner */}
              <div className="relative w-16 h-16 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-black border-r-gray-400 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-gray-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>

                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-black rounded-full animate-pulse"></div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-black mb-4">
                Almost there!
              </h3>
              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                We're setting up your personalized Loop Review dashboard with all your customizations...
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6 overflow-hidden">
                <div className="h-full bg-black rounded-full animate-progress" style={{
                  animation: 'progress 2s ease-in-out infinite',
                  width: '70%'
                }}></div>
              </div>

              <p className="text-xs text-gray-500 font-medium">
                This will just take a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cookie preferences link */}
      <footer className="absolute bottom-4 left-4 text-xs text-gray-500 z-10">
        <a href="#" className="underline">
          Cookie preferences
        </a>
      </footer>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes explode {
          0% {
            transform: translate(0, 0) scale(0.5) rotateZ(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(
                calc(var(--x-direction) * 700px),
                calc(var(--y-direction) * 700px)
              )
              scale(1)
              rotateZ(720deg);
            opacity: 0;
          }
        }
        .confetti {
          animation-name: explode;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(0.8);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-8px) translateX(3px) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-4px) translateX(-3px) scale(1.1);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-12px) translateX(5px) scale(0.9);
            opacity: 0.4;
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-float {
          animation-name: float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .animate-progress {
          animation-name: progress;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
    </main>
  )
}