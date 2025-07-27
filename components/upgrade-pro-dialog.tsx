import type React from "react"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, User, BarChart2, Users, Zap, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function UpgradeProDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleUpgradeClick = () => {
    router.push("/?tab=upgrade")
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[900px] h-[600px] p-0 rounded-xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade to Loop Pro</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          {/* Left Section */}
          <div className="flex-1 p-8 flex flex-col justify-between bg-white dark:bg-gray-900">
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Upgrade to Loop Pro</p>
            <h2 className="mt-2 text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-50">
              Take your Loop further with a free 7-day Pro trial!
            </h2>

            <p className="mt-6 text-gray-700 dark:text-gray-300">Get instant access to Pro features, including:</p>
            <ul className="mt-4 space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-semibold">Hide Loop branding</span> for a cleaner look
              </li>
              <li className="flex items-center gap-3">
                <BarChart2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-semibold">Advanced analytics</span> to track your performance
              </li>
              <li className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-semibold">Team collaboration</span> features
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pro is just $14 USD/month once your trial's up. You can cancel any time!
            </p>
            <Button 
              className="mt-4 w-full rounded-full bg-black py-6 text-lg font-semibold text-white hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
              onClick={handleUpgradeClick}
            >
              <Zap className="mr-2 h-5 w-5" />
              Try Pro for free
            </Button>
          </div>
        </div>

        {/* Right Section */}
        <div className="relative flex-1 bg-[#F0C878] dark:bg-yellow-800">
          <Image
            src="/upgrade-picture.png"
            alt="Loop Pro Features"
            fill
            style={{ objectFit: "cover" }}
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30 dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Floating Cards */}
          <Card className="absolute top-1/4 right-8 p-4 rounded-xl bg-[#E0BBE4] text-center shadow-lg dark:bg-purple-700">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/30 mx-auto text-purple-800 dark:text-purple-200">
              <DollarSign className="h-6 w-6" />
            </div>
            <p className="mt-2 text-3xl font-bold text-purple-900 dark:text-purple-100">189</p>
            <p className="text-sm text-purple-800 dark:text-purple-200">Reviews collected</p>
          </Card>

          <Card className="absolute bottom-1/4 left-8 p-4 rounded-xl bg-white shadow-lg dark:bg-gray-800">
            <div className="flex gap-2 mb-2">
              <Image
                src="/placeholder.svg?height=40&width=40"
                alt="Feature 1"
                width={40}
                height={40}
                className="rounded-md object-cover"
              />
              <Image
                src="/placeholder.svg?height=40&width=40"
                alt="Feature 2"
                width={40}
                height={40}
                className="rounded-md object-cover"
              />
              <Image
                src="/placeholder.svg?height=40&width=40"
                alt="Feature 3"
                width={40}
                height={40}
                className="rounded-md object-cover"
              />
            </div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">Pro Features</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Unlock all features</p>
          </Card>

          <div className="absolute bottom-8 left-8 text-white">
            <h3 className="text-2xl font-bold">Loop Pro</h3>
            <p className="text-sm">Advanced review collection platform</p>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}