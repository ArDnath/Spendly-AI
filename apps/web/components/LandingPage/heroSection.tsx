
"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Shield, Clock, Zap, Sparkles } from "lucide-react"
import { useRef } from "react"

export function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center">
      <motion.div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black" style={{ y }} />

      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" style={{ opacity }}>
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6"
          >
            <Badge className="bg-gray-800/90 text-white border-gray-600 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Cost Control
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 text-balance"
          >
            Stop AI Bill <span className="text-white">Surprises</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto text-pretty"
          >
            Track AI costs, set alerts, stay in control
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mb-8 "
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className ="rounded-xl py-4"
            >
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-black text-lg px-8 py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden group "
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent py-4"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                Start Free Audit
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-gray-400"
          >
            {[
              { icon: CheckCircle, text: "No credit card" },
              { icon: Shield, text: "Secure & private" },
              { icon: Clock, text: "Setup in 2 minutes" },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2"
                whileHover={{
                  y: -2,
                  color: "#ffffff",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                  <item.icon className="w-4 h-4 text-white" />
                </motion.div>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            className="relative max-w-4xl mx-auto"
          >
            <motion.div
              className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 shadow-2xl backdrop-blur-sm"
              whileHover={{
                y: -5,
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="bg-black/50 rounded border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">AI Spend Dashboard</h3>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Badge className="bg-white text-black">
                      <Zap className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "This Month", value: "$247.83", change: "↓ 23% saved", color: "text-green-400" },
                    { label: "Budget Left", value: "$752", change: "of $1,000", color: "text-gray-400" },
                    { label: "Alerts", value: "2", change: "Active", color: "text-gray-400" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="bg-gray-800/50 p-3 rounded border border-gray-700"
                      whileHover={{
                        scale: 1.02,
                        borderColor: "rgba(255, 255, 255, 0.3)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <p className="text-sm text-gray-400">{item.label}</p>
                      <motion.p className="text-2xl font-bold text-white" whileHover={{ scale: 1.1 }}>
                        {item.value}
                      </motion.p>
                      <p className={`text-xs ${item.color}`}>{item.change}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="bg-gray-800/80 border border-gray-600 rounded p-3"
                  animate={{
                    opacity: [0.9, 1, 0.9],
                    borderColor: ["rgba(156, 163, 175, 0.6)", "rgba(156, 163, 175, 0.8)", "rgba(156, 163, 175, 0.6)"],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    />
                    <p className="text-sm font-medium text-white">Alert: OpenAI usage trending 40% above normal</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

