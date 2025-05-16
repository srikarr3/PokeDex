'use client';

import Header from './Header';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative bg-white">
      {/* Faint Pokéball pattern */}
      <div className="fixed inset-0 bg-[url('/pokeball-pattern.svg')] opacity-10 pointer-events-none" />
      {/* Content */}
      <div className="relative z-10">
        <Header />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-4 py-8"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/70">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
} 