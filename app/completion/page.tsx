"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { User, MoreHorizontal } from "lucide-react"
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
    console.log('📤 Submitting onboarding data:', JSON.stringify(data, null, 2))
    console.log('📤 Company name from data:', data.companyName)
    console.log('📤 Company profile from data:', data.companyProfile)
    
    const success = await submitOnboarding()
    
    if (success) {
      console.log('✅ Onboarding completed successfully')
      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.replace('/')
    } else {
      console.log('⚠️ Onboarding save failed, but proceeding to dashboard')
      // Even if save fails, proceed to dashboard
      sessionStorage.setItem('onboarding_completed', 'true')
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.replace('/')
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

  // Individual template components that match exact designs
  const TemplatePreview = ({ template, companyName, profileImage, companyLinks }: { 
    template: Template | null, 
    companyName: string, 
    profileImage: string | null,
    companyLinks: string[]
  }) => {
    const defaultLinks = companyLinks.length > 0 ? companyLinks.slice(0, 4) : [
      "Google Reviews", "Website", "Contact", "Social Media"
    ]

    if (!template) {
      // Default template
      return (
        <div className="w-full h-full bg-[#F0EDE8] flex flex-col items-center p-8 space-y-6">
          <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-20 w-20 text-gray-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{companyName}</h2>
          <div className="w-full space-y-3 px-4">
            {defaultLinks.map((link, index) => (
              <div key={index} className="w-full bg-white rounded-lg p-4 flex items-center justify-between text-gray-800 font-medium shadow-sm">
                <span className="text-base">{link}</span>
                <MoreHorizontal className="h-5 w-5 opacity-60" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (template.id) {
      case 'b-01': // Emmy - Clean and professional
        return (
          <div className="w-full h-full bg-white flex flex-col items-center justify-start py-12 px-6">
            {/* Profile Section */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden mb-4">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>
            
            {/* Name and Bio */}
            <h1 className="text-lg font-semibold text-gray-900 mb-1">{companyName}</h1>
            <p className="text-sm text-gray-600 mb-8 text-center">Clean & Professional</p>
            
            {/* Links */}
            <div className="w-full max-w-sm space-y-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-white border border-gray-300 rounded-full py-3 px-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-gray-800 font-medium">{link}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'b-02': // Holly - Modern with vibrant colors
        return (
          <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex flex-col items-center justify-start py-12 px-6">
            {/* Profile Section */}
            <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center overflow-hidden mb-4 shadow-xl">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-purple-600" />
              )}
            </div>
            
            {/* Name and Bio */}
            <h1 className="text-lg font-semibold text-white mb-1">{companyName}</h1>
            <p className="text-sm text-white/80 mb-8 text-center">Modern & Vibrant</p>
            
            {/* Links */}
            <div className="w-full max-w-sm space-y-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl py-4 px-6 text-center shadow-lg hover:bg-white/20 transition-all">
                  <span className="text-white font-medium">{link}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'b-03': // Lexie Classic - Classic business elegant
        return (
          <div className="w-full h-full bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-start py-12 px-6">
            {/* Profile Section */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center overflow-hidden mb-4 shadow-lg">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>
            
            {/* Name and Bio */}
            <h1 className="text-lg font-serif font-bold text-gray-900 mb-1">{companyName}</h1>
            <p className="text-sm text-gray-600 mb-8 text-center">Classic Elegance</p>
            
            {/* Links */}
            <div className="w-full max-w-sm space-y-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-white border-2 border-gray-300 rounded-lg py-3 px-6 text-center shadow-sm hover:border-gray-400 hover:shadow-md transition-all">
                  <span className="text-gray-800 font-medium">{link}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'c-06': // Tatiana - Bold and artistic
        return (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-pink-800 to-orange-600 flex flex-col items-center justify-start py-12 px-6 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-4 w-8 h-8 bg-yellow-400 rounded-full opacity-70"></div>
              <div className="absolute top-24 right-6 w-6 h-6 bg-pink-400 rounded-full opacity-60"></div>
              <div className="absolute bottom-32 left-8 w-10 h-10 bg-cyan-400 rounded-full opacity-50"></div>
            </div>
            
            {/* Profile Section */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 flex items-center justify-center overflow-hidden mb-4 shadow-2xl border-4 border-white/30 relative z-10">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-14 w-14 text-white" />
              )}
            </div>
            
            {/* Name and Bio */}
            <h1 className="text-xl font-bold text-white mb-1 tracking-wide relative z-10">{companyName}</h1>
            <p className="text-sm text-pink-200 mb-8 text-center relative z-10">Bold & Artistic</p>
            
            {/* Links */}
            <div className="w-full max-w-sm space-y-4 relative z-10">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full py-4 px-6 text-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all transform">
                  <span className="text-white font-bold">{link}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'c-04': // Salka - Artistic warm
        return (
          <div className="w-full h-full flex flex-col items-center p-8 space-y-6 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 50%, #FCD34D 100%)' }}>
            <div className="w-26 h-26 rounded-full bg-yellow-400 border-4 border-yellow-300 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-orange-900" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-yellow-100 mb-1">{companyName}</h2>
              <p className="text-sm text-orange-200">Unique Expression</p>
            </div>
            <div className="w-full space-y-3 pt-4 px-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-yellow-400/80 text-orange-900 rounded-2xl border-2 border-yellow-300 p-4 flex items-center justify-between font-medium hover:bg-yellow-300 transition-colors">
                  <span className="text-base font-semibold">{link}</span>
                  <MoreHorizontal className="h-5 w-5 text-orange-800" />
                </div>
              ))}
            </div>
          </div>
        )

      case 'm-03': // Kevin - Clean minimal
        return (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-start py-16 px-6">
            {/* Profile Section */}
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center overflow-hidden mb-6">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            
            {/* Name and Bio */}
            <h1 className="text-lg font-light text-black mb-1">{companyName}</h1>
            <p className="text-xs text-gray-500 mb-10 text-center">Minimal Design</p>
            
            {/* Links */}
            <div className="w-full max-w-xs space-y-3">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-white border border-gray-200 rounded-md py-3 px-4 text-center shadow-sm hover:border-black transition-colors">
                  <span className="text-black text-sm font-medium">{link}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'm-01': // Ella - Pure minimal
        return (
          <div className="w-full h-full bg-white flex flex-col items-center p-10 space-y-10">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-normal text-black mb-1">{companyName}</h2>
              <p className="text-xs text-gray-500">Pure Minimal</p>
            </div>
            <div className="w-full space-y-5 pt-6 px-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-white border border-gray-200 rounded-md p-3 flex items-center justify-between text-black hover:border-gray-400 transition-colors">
                  <span className="text-sm">{link}</span>
                  <MoreHorizontal className="h-3 w-3 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )

      case 'p-01': // Gabrielle Classic - Warm personal
        return (
          <div className="w-full h-full bg-orange-50 flex flex-col items-center p-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-orange-600" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-orange-900 mb-1">{companyName}</h2>
              <p className="text-sm text-orange-700">Warm & Friendly</p>
            </div>
            <div className="w-full space-y-3 pt-4 px-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-white border border-orange-200 rounded-xl p-4 flex items-center justify-between text-orange-800 font-medium shadow-sm hover:bg-orange-50 transition-colors">
                  <span className="text-base">{link}</span>
                  <MoreHorizontal className="h-5 w-5 text-orange-500" />
                </div>
              ))}
            </div>
          </div>
        )

      case 'p-04': // Gibby - Fun playful
        return (
          <div className="w-full h-full flex flex-col items-center p-8 space-y-6 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #F59E0B 100%)' }}>
            <div className="w-28 h-28 rounded-full bg-yellow-300 border-4 border-orange-300 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-18 w-18 text-orange-800" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-orange-900 mb-1">{companyName}</h2>
              <p className="text-sm text-orange-700">Fun & Playful</p>
            </div>
            <div className="w-full space-y-4 pt-4 px-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-white/90 text-orange-800 rounded-full border-2 border-orange-300 p-4 flex items-center justify-between font-medium hover:bg-white transition-colors">
                  <span className="text-base font-semibold">{link}</span>
                  <MoreHorizontal className="h-5 w-5 text-orange-600" />
                </div>
              ))}
            </div>
          </div>
        )

      case 'r-06': // Restaurant Oyster - Fine dining
        return (
          <div className="w-full h-full bg-red-900 flex flex-col items-center p-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-red-900" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-serif font-bold text-amber-100 mb-1">{companyName}</h2>
              <p className="text-sm text-amber-200">Fine Dining</p>
            </div>
            <div className="w-full space-y-3 pt-4 px-4">
              {defaultLinks.map((link, index) => (
                <div key={index} className="w-full bg-amber-100 text-red-900 rounded-lg p-4 flex items-center justify-between font-medium hover:bg-amber-200 transition-colors">
                  <span className="text-base">{link}</span>
                  <MoreHorizontal className="h-5 w-5 text-red-800" />
                </div>
              ))}
            </div>
          </div>
        )

      default:
        // Fallback to the styled version
        return (
          <div 
            className={`w-full h-full flex flex-col items-center p-8 space-y-6 ${templateStyles.containerClasses}`}
            style={templateStyles.backgroundStyle}
          >
            <div className={`relative flex items-center justify-center overflow-hidden ${templateStyles.profileImageClasses}`}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-20 w-20 text-gray-500" />
              )}
            </div>
            <div className="text-center space-y-2">
              <h2 className={templateStyles.nameClasses}>{companyName}</h2>
              <p className={templateStyles.bioClasses}>Using {template?.name} template</p>
            </div>
            <div className="w-full space-y-3">
              {defaultLinks.map((link, index) => (
                <div key={index} className={`w-full p-4 flex items-center justify-between font-medium ${templateStyles.buttonClasses} transition-all duration-200`}>
                  <span className="text-base truncate">{link}</span>
                  <MoreHorizontal className="h-5 w-5 opacity-60" />
                </div>
              ))}
            </div>
          </div>
        )
    }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-[#8A2BE2] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Completing your setup</h3>
            <p className="text-gray-600 mb-4">We're saving your preferences and preparing your dashboard...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#8A2BE2] h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
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

      {/* Confetti CSS */}
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
      `}</style>
    </main>
  )
}