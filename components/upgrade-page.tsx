"use client"

import { Check, Star, Zap, Shield, Users, BarChart3, Headphones, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UpgradePage() {
  const plans = [
    {
      name: "Starter",
      price: "€29",
      period: "/month",
      description: "Perfect for small businesses getting started with review management",
      features: [
        "Up to 100 reviews/month",
        "Basic email templates",
        "Standard support",
        "1 integration",
        "Basic analytics",
      ],
      popular: false,
      current: true,
    },
    {
      name: "Professional",
      price: "€79",
      period: "/month",
      description: "Ideal for growing businesses that need advanced features",
      features: [
        "Up to 500 reviews/month",
        "Custom email templates",
        "Priority support",
        "5 integrations",
        "Advanced analytics",
        "A/B testing",
        "Custom branding",
      ],
      popular: true,
      current: false,
    },
    {
      name: "Enterprise",
      price: "€199",
      period: "/month",
      description: "For large businesses with complex review management needs",
      features: [
        "Unlimited reviews",
        "White-label solution",
        "Dedicated support",
        "Unlimited integrations",
        "Advanced analytics",
        "API access",
        "Custom workflows",
        "Team management",
      ],
      popular: false,
      current: false,
    },
  ]

  const features = [
    {
      icon: Star,
      title: "Review Collection",
      description: "Automated review requests via SMS and email",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into your review performance",
    },
    {
      icon: Shield,
      title: "Brand Protection",
      description: "Monitor and manage your online reputation",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team on review management",
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Set up automated workflows for review collection",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Get help whenever you need it",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white px-4 py-2 rounded-full text-sm font-medium">
          <Crown className="w-4 h-4" />
          Upgrade Your Plan
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Choose the Perfect Plan for Your Business</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Unlock powerful features to grow your business and manage reviews more effectively
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative ${plan.popular ? "ring-2 ring-pink-500 shadow-lg" : "border border-gray-200"}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-3 right-4">
                <Badge variant="outline" className="bg-white">
                  Current Plan
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600">{plan.period}</span>
              </div>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  plan.current
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : plan.popular
                      ? "bg-gradient-to-r from-[#e66465] to-[#9198e5] hover:from-[#d55555] hover:to-[#8088d5] text-white"
                      : "bg-gradient-to-r from-[#e66465] to-[#9198e5] hover:from-[#d55555] hover:to-[#8088d5] text-white"
                }`}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade Now"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Everything You Need to Succeed</h2>
          <p className="text-gray-600">Powerful features to help you collect and manage reviews effectively</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-[#e66465] to-[#9198e5] p-2 rounded-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Upgrade?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of businesses that trust Loop for their review management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-[#e66465] hover:bg-gray-100">Start Free Trial</Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#e66465] bg-transparent"
            >
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
