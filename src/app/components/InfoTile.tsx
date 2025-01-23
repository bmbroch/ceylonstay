"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, ThermometerSun, Building, DollarSign } from "lucide-react"

export default function InfoTile() {
  return (
    <Card className="group overflow-hidden h-[220px] md:h-[240px]">
      <CardContent className="h-full flex flex-col py-8 px-6">
        {/* Hero Content */}
        <h2 className="text-lg font-bold leading-tight text-center mb-8">
          Curated <span className="relative">
            <span className="relative z-10">long(ish) term rentals</span>
            <span className="absolute bottom-0 left-0 w-full h-[6px] bg-rose-500/30 -rotate-1" aria-hidden="true"></span>
            <span className="absolute bottom-0 left-0 w-full h-[6px] bg-rose-500/30 rotate-1" aria-hidden="true"></span>
          </span> for{" "}
          <span className="whitespace-nowrap">💻 digital nomads</span> &{" "}
          <span className="whitespace-nowrap">✈️ travelers</span>{" "}
          <span className="whitespace-nowrap">in Sri Lanka 🇱🇰</span>
        </h2>

        {/* Features Grid */}
        <div className="max-w-[320px] mx-auto w-full">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Feature
              icon={<CheckCircle2 className="h-4 w-4 text-rose-500" />}
              title="Month to Month"
              description="Flexible stays"
            />
            <Feature
              icon={<DollarSign className="h-4 w-4 text-rose-500" />}
              title="Affordable Price"
              description="Best value rentals"
            />
            <Feature
              icon={<ThermometerSun className="h-4 w-4 text-rose-500" />}
              title="Air Conditioned"
              description="Modern comfort"
            />
            <Feature
              icon={<Building className="h-4 w-4 text-rose-500" />}
              title="Trusted Properties"
              description="Verified listings"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeatureProps {
  icon: React.ReactNode
  title: string
  description: string
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-1.5">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-normal">{description}</p>
    </div>
  )
} 