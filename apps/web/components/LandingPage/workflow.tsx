
"use client"

import { motion, useInView } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Plug, Bell, BarChart3 } from "lucide-react"
import { useRef } from "react"

export function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const steps = [
    {
      icon: Plug,
      number: 1,
      title: "Connect API keys",
      description: "Securely connect your AI accounts. Keys are encrypted and optionally self-hosted.",
    },
    {
      icon: Bell,
      number: 2,
      title: "Get real-time alerts",
      description: "Set budget limits and receive proactive warnings before costs spiral.",
    },
    {
      icon: BarChart3,
      number: 3,
      title: "Gain full control",
      description: "Monitor all AI spending in one dashboard. Optimize for maximum efficiency.",
    },
  ]

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Get started in 3 simple steps</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Setup takes minutes, not hours. Start protecting your AI budget today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-white/20 via-white/40 to-white/20 -translate-y-1/2 z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }
                  : {
                      opacity: 0,
                      y: 50,
                      scale: 0.8,
                    }
              }
              transition={{
                duration: 0.6,
                delay: index * 0.2,
                ease: "easeOut",
              }}
            >
              <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="mb-6 border-2 border-gray-700 bg-gray-800/50 hover:border-white/30 transition-all duration-300 backdrop-blur-sm group">
                  <CardContent className="p-8">
                    <motion.div
                      className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <motion.div
                      className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold"
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {step.number}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-white transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 group-hover:text-white transition-colors">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
