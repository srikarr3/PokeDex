'use client';
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";

// Define Achievement structure
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType; // Optional: specific icon for the achievement
  points: number;
  isUnlocked: boolean;
  unlockCondition: (context: AchievementContext) => boolean; // Function to check if unlocked
  // Optional: progress towards achievement
  progress?: () => { current: number; target: number }; 
}

// Define context for achievements (e.g., Pokémon viewed, battles won, etc.)
// This would be expanded as features are built and can trigger achievements
interface AchievementContext {
  pokemonViewedCount: number;
  favoritesCount: number;
  battlesWon: number;
  // Add more context fields as needed
  // e.g., teamsCreated, specificPokemonCaught, etc.
}

// Example Achievements Definition
const initialAchievementsList: Omit<Achievement, 'isUnlocked'>[] = [
  {
    id: "view_10_pokemon",
    name: "Rookie Explorer",
    description: "View details of 10 different Pokémon.",
    icon: SparklesIcon,
    points: 10,
    unlockCondition: () => parseInt(localStorage.getItem("pokemonViewedCount") || "0") >= 10,
    progress: () => ({ current: parseInt(localStorage.getItem("pokemonViewedCount") || "0"), target: 10 }),
  },
  {
    id: "view_50_pokemon",
    name: "Seasoned Adventurer",
    description: "View details of 50 different Pokémon.",
    icon: SparklesIcon,
    points: 50,
    unlockCondition: () => parseInt(localStorage.getItem("pokemonViewedCount") || "0") >= 50,
    progress: () => ({ current: parseInt(localStorage.getItem("pokemonViewedCount") || "0"), target: 50 }),
  },
  {
    id: "add_favorite",
    name: "First Favorite!",
    description: "Mark your first Pokémon as a favorite.",
    icon: SparklesIcon,
    points: 5,
    unlockCondition: () => parseInt(localStorage.getItem("favoritesCount") || "0") > 0,
    progress: () => ({ current: parseInt(localStorage.getItem("favoritesCount") || "0"), target: 1 }),
  },
  {
    id: "win_battle",
    name: "Battle Novice",
    description: "Win your first simulated battle.",
    icon: SparklesIcon,
    points: 20,
    unlockCondition: () => parseInt(localStorage.getItem("battlesWon") || "0") > 0,
    progress: () => ({ current: parseInt(localStorage.getItem("battlesWon") || "0"), target: 1 }),
  },
  {
    id: "create_team",
    name: "Team Strategist",
    description: "Create and save your first Pokémon team.",
    icon: SparklesIcon,
    points: 15,
    unlockCondition: () => (JSON.parse(localStorage.getItem("savedPokedexTeams") || "[]")).length > 0,
    progress: () => ({ current: (JSON.parse(localStorage.getItem("savedPokedexTeams") || "[]")).length > 0 ? 1: 0, target: 1 }),
  }
  // Add more achievements here
];

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // Simulate fetching/updating achievement context from localStorage or a global state
  const getAchievementContext = useCallback((): AchievementContext => {
    // In a real app, this might come from a global state/context updated by other components
    return {
      pokemonViewedCount: parseInt(localStorage.getItem("pokemonViewedCount") || "0"),
      favoritesCount: parseInt(localStorage.getItem("favoritesCount") || "0"),
      battlesWon: parseInt(localStorage.getItem("battlesWon") || "0"),
    };
  }, []);

  useEffect(() => {
    const context = getAchievementContext();
    const loadedAchievements = initialAchievementsList.map(ach => ({
      ...ach,
      isUnlocked: ach.unlockCondition(context),
    }));
    setAchievements(loadedAchievements);
    setTotalPoints(loadedAchievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0));

    // Listen for custom events that might trigger re-checking achievements
    const handleAchievementUpdate = () => {
      const newContext = getAchievementContext();
      const updatedAchievements = initialAchievementsList.map(ach => ({
        ...ach,
        isUnlocked: ach.unlockCondition(newContext),
      }));
      setAchievements(updatedAchievements);
      setTotalPoints(updatedAchievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0));
    };
    window.addEventListener("achievementsUpdated", handleAchievementUpdate);
    return () => window.removeEventListener("achievementsUpdated", handleAchievementUpdate);
  }, []);

  // Helper function to dispatch an update event (e.g., after viewing a Pokemon)
  // static dispatchAchievementUpdate() {
  //   window.dispatchEvent(new CustomEvent("achievementsUpdated"));
  // }

  return (
    <div className="container mx-auto p-4">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-center mb-4">
        Achievements
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{delay: 0.2}} className="text-center text-xl mb-8 text-yellow-500 dark:text-yellow-400">
        Total Points: {totalPoints}
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {achievements.map((ach, index) => {
            const IconComponent = ach.icon || SparklesIcon;
            const progressData = ach.progress ? ach.progress() : null;
            const progressPercent = progressData && progressData.target > 0 ? (progressData.current / progressData.target) * 100 : 0;

            return (
            <motion.div
              key={ach.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-5 rounded-lg shadow-lg flex flex-col items-center text-center transition-all duration-300 
                          ${ach.isUnlocked ? "bg-green-100 dark:bg-green-800 border-2 border-green-500" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"}`}
            >
              <div className={`mb-3 p-3 rounded-full ${ach.isUnlocked ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}>
                {ach.isUnlocked ? 
                  <CheckCircleIcon className="w-10 h-10 text-white" /> : 
                  <IconComponent className="w-10 h-10 text-white" />
                }
              </div>
              <h3 className={`text-xl font-semibold mb-1 ${ach.isUnlocked ? "text-green-700 dark:text-green-300" : "text-gray-800 dark:text-gray-100"}`}>{ach.name}</h3>
              <p className={`text-sm mb-2 ${ach.isUnlocked ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>{ach.description}</p>
              <p className={`font-bold text-lg ${ach.isUnlocked ? "text-yellow-600 dark:text-yellow-400" : "text-gray-500 dark:text-gray-300"}`}>{ach.points} Points</p>
              {!ach.isUnlocked && progressData && progressData.target > 0 && (
                <div className="w-full mt-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-right">{progressData.current} / {progressData.target}</div>
                  <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2.5">
                    <motion.div 
                        className="bg-blue-500 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    />
                  </div>
                </div>
              )}
              {ach.isUnlocked && <p className="mt-2 text-xs text-green-500 dark:text-green-300">Unlocked!</p>}
            </motion.div>
          )})}
        </AnimatePresence>
      </div>
      <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p>More achievements will be added as you explore and use new features!</p>
        <p>(Note: Achievement progress is stored locally in your browser.)</p>
      </div>
    </div>
  );
};

export default AchievementsPage;

// To trigger achievement updates from other components:
// Example: After a Pokémon detail page is viewed
// if (typeof window !== undefined) {
//   let count = parseInt(localStorage.getItem("pokemonViewedCount") || "0");
//   localStorage.setItem("pokemonViewedCount", (count + 1).toString());
//   window.dispatchEvent(new CustomEvent("achievementsUpdated"));
// }

