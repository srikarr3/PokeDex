'use client';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { QuestionMarkCircleIcon, TrophyIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { fetchPokemonList } from '@/lib/pokeapi';
import LoadingSpinner from './LoadingSpinner';

// Define AchievementContext type
interface AchievementContext {
  pokemonViewedCount: number;
  favoritesCount: number;
  battlesWon: number;
}

// Simplified Achievement structure for points calculation
interface Achievement {
  id: string;
  name: string;
  description: string;
  points: number;
  unlockCondition: (context: AchievementContext) => boolean;
}

// Copied from AchievementsPage for consistency - in a real app, share this
const initialAchievementsListForPoints: Omit<Achievement, 'isUnlocked'>[] = [
  {
    id: "view_10_pokemon",
    name: "Rookie Explorer",
    description: "View details of 10 different Pokémon.",
    points: 10,
    unlockCondition: (ctx) => ctx.pokemonViewedCount >= 10,
  },
  {
    id: "view_50_pokemon",
    name: "Seasoned Adventurer",
    description: "View details of 50 different Pokémon.",
    points: 50,
    unlockCondition: (ctx) => ctx.pokemonViewedCount >= 50,
  },
  {
    id: "add_favorite",
    name: "First Favorite!",
    description: "Mark your first Pokémon as a favorite.",
    points: 5,
    unlockCondition: (ctx) => ctx.favoritesCount > 0,
  },
  {
    id: "win_battle",
    name: "Battle Novice",
    description: "Win your first simulated battle.",
    points: 20,
    unlockCondition: (ctx) => ctx.battlesWon > 0,
  },
  {
    id: "create_team",
    name: "Team Strategist",
    description: "Create and save your first Pokémon team.",
    points: 15,
    unlockCondition: (ctx) => {
      try {
        return (JSON.parse(localStorage.getItem("savedPokedexTeams") || "[]")).length > 0;
      } catch {
        return false;
      }
    },
  }
];

const getAchievementContextForPoints = (): AchievementContext => {
  return {
    pokemonViewedCount: parseInt(localStorage.getItem("pokemonViewedCount") || "0"),
    favoritesCount: parseInt(localStorage.getItem("favoritesCount") || "0"),
    battlesWon: parseInt(localStorage.getItem("battlesWon") || "0"),
  };
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/battle', label: 'Battle' },
  { href: '/team-builder', label: 'Team Builder' },
  { href: '/type-calculator', label: 'Type Calculator' },
  { href: '/moves', label: 'Moves' },
  { href: '/breeding', label: 'Breeding' },
  { href: '/achievements', label: 'Achievements' },
];

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [totalPokemon, setTotalPokemon] = useState(0);
  const [achievementPoints, setAchievementPoints] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Memoize achievement points calculation
  const calculateAchievementPoints = useCallback(() => {
    const context = getAchievementContextForPoints();
    return initialAchievementsListForPoints
      .filter(ach => ach.unlockCondition(context))
      .reduce((sum, ach) => sum + ach.points, 0);
  }, []);

  useEffect(() => {
    setMounted(true);
    const updateTotalAchievementPoints = () => {
      const currentPoints = calculateAchievementPoints();
      setAchievementPoints(prev => (prev !== currentPoints ? currentPoints : prev));
    };
    updateTotalAchievementPoints();
    window.addEventListener("achievementsUpdated", updateTotalAchievementPoints);
    return () => {
      window.removeEventListener("achievementsUpdated", updateTotalAchievementPoints);
    };
  }, [calculateAchievementPoints]);

  useEffect(() => {
    const getTotalPokemon = async () => {
      try {
        const data = await fetchPokemonList(1, 0); 
        setTotalPokemon(data.count);
      } catch (error) {
        console.error("Failed to fetch total Pokémon count:", error);
        setTotalPokemon(1025); 
      }
    };
    getTotalPokemon();
  }, []);

  const handleNavigation = (href: string) => {
    router.push(href);
    if(isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const handleRandomPokemon = async () => {
    if (totalPokemon === 0) return;
    const randomId = Math.floor(Math.random() * totalPokemon) + 1;
    router.push(`/creature/${randomId}`);
    if(isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  if (!mounted) {
    return null;
  }

  const mobileMenuVariants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      scale: 0.95,
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1
      } 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.95,
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.05,
        staggerDirection: -1
      } 
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20"
      >
        <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <motion.button
            onClick={() => handleNavigation('/')}
            className="text-4xl font-comic font-bold text-gray-800 hover:opacity-80 transition-all duration-300 transform hover:scale-105 tracking-wider bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Pokédex
          </motion.button>

          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <motion.button
                key={link.href}
                onClick={() => handleNavigation(link.href)}
                onHoverStart={() => setHoveredLink(link.href)}
                onHoverEnd={() => setHoveredLink(null)}
                className={`relative px-4 py-2 rounded-lg text-sm font-comic font-bold text-gray-700 transition-all duration-300 tracking-wider ${
                  pathname === link.href 
                    ? 'bg-white/50 text-gray-900 shadow-md' 
                    : 'hover:bg-white/30'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {link.label}
                {hoveredLink === link.href && (
                  <motion.div
                    layoutId="hoverIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </motion.button>
            ))}
            <motion.button
              onClick={handleRandomPokemon}
              className="p-2 rounded-lg text-gray-700 hover:bg-white/30 transition-all duration-300 flex items-center text-sm font-comic font-bold tracking-wider shadow-sm"
              aria-label="Random Pokémon"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95, rotate: -5 }}
              disabled={totalPokemon === 0}
            >
              <QuestionMarkCircleIcon className="w-5 h-5 mr-1" /> Random
            </motion.button>
            <motion.button
              onClick={() => handleNavigation('/achievements')}
              className="p-2 rounded-lg text-gray-700 hover:bg-white/30 transition-all duration-300 flex items-center text-sm font-comic font-bold tracking-wider shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrophyIcon className="w-5 h-5 mr-1 text-yellow-500" /> 
              <span className="font-comic font-bold">{achievementPoints}</span>
            </motion.button>
          </div>

          <div className="md:hidden flex items-center">
            <motion.button
              onClick={() => handleNavigation('/achievements')}
              className="p-2 mr-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrophyIcon className="w-6 h-6 text-yellow-500" /> 
              <span className="font-comic font-bold text-sm ml-1">{achievementPoints}</span>
            </motion.button>
            <motion.button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-800 focus:outline-none hover:bg-gray-100 transition-all duration-300"
              aria-label="Toggle mobile menu"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95, rotate: -5 }}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div 
                  key={isMobileMenuOpen ? "x-mark" : "bars3"} 
                  initial={{ rotate: -90, opacity: 0 }} 
                  animate={{ rotate: 0, opacity: 1 }} 
                  exit={{ rotate: 90, opacity: 0 }} 
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl pb-4 origin-top" 
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              variants={mobileMenuVariants}
            >
              <div className="px-4 pt-4 pb-3 space-y-2">
                {navLinks.map((link) => (
                  <motion.button 
                    key={link.href} 
                    onClick={() => handleNavigation(link.href)}
                    variants={menuItemVariants}
                    className={`w-full text-left px-4 py-3 rounded-lg text-base font-comic font-bold text-gray-700 hover:bg-gray-100 transition-all duration-300 tracking-wider ${
                      pathname === link.href ? 'bg-gray-100 text-gray-900' : ''
                    }`}
                    whileHover={{ x: 10 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {link.label}
                  </motion.button>
                ))}
                <motion.button 
                  onClick={handleRandomPokemon} 
                  variants={menuItemVariants}
                  className="w-full text-left px-4 py-3 rounded-lg text-base font-comic font-bold text-gray-700 hover:bg-gray-100 transition-all duration-300 flex items-center tracking-wider" 
                  disabled={totalPokemon === 0}
                  whileHover={{ x: 10 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 mr-2" /> Random Pokémon
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </Suspense>
  );
};

export default Header;

