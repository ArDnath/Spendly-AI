
"use client"

import { motion, useInView } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Eye, Shield, Search, Users, BarChart3 } from "lucide-react"
import { useRef } from "react"

export function ProblemSolutionSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-balance">
            Waking up to unexpected AI bills?
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto text-pretty">
            Many teams struggle with lack of visibility into AI costs and no proactive monitoring.
          </p>
        </motion.div>

        <div className="mb-12">
          <motion.h3
            className="text-2xl font-bold text-center text-white mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            SpendlyAI gives you complete control
          </motion.h3>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {[
              {
                icon: AlertTriangle,
                title: "Smart Spend Alerts",
                description: "Predictive warnings before bills spiral. Stop surprise bills before they happen.",
              },
              {
                icon: Eye,
                title: "Unified Dashboard",
                description: "All providers in one view. Protect your runway with crystal-clear visibility.",
              },
              {
                icon: Shield,
                title: "API Key Manager",
                description: "Secure, encrypted storage with enterprise-grade protection.",
              },
              {
                icon: Search,
                title: "Root-Cause Insights",
                description: "Identify exactly which job or script is burning tokens.",
              },
              {
                icon: Users,
                title: "Team Governance",
                description: "Track usage across teams for accountability and compliance.",
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Deep insights into usage patterns and optimization opportunities.",
              },
            ].map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-2 border-gray-700 bg-gray-800/50 hover:border-white/30 transition-all duration-300 group backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                    </div>
                    <p className="text-gray-300 group-hover:text-white transition-colors">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
