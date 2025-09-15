
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "../ui/button";
import { LogOut, User, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { data: session, status } = useSession();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 pt-4 left-0 right-0 z-50 "
    >
      <div
        className="container  mx-auto px-4 h-16 flex items-center justify-between backdrop-blur-lg bg-black/40 border-b border-white/10 rounded-xl shadow-lg"
        style={{
          boxShadow: "0 0px 32px 0 rgba(139, 145, 236, 0.46)",
          WebkitBackdropFilter: "blur(12px)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
        }}
      >
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">SpendlyAI</h1>
          </Link>
        </motion.div>

        {/* Navigation / Auth */}
        <div className="hidden md:flex items-center space-x-4">
          {status === "loading" ? (
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : session ? (
            <>
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </motion.div>
              
              <div className="flex items-center gap-2 text-sm text-white/80">
                <User className="w-4 h-4" />
                <span>Welcome, {session.user?.name}</span>
              </div>
              
              <motion.div 
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)"
                }} 
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-medium"
                  size="sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(255, 255, 255, 0.3)"
                }} 
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Button 
                  className="bg-white text-black hover:bg-gray-100 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                  onClick={() => signIn()}
                >
                  Get Started
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

