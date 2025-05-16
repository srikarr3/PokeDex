'use client';
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Define interfaces for Move data (based on PokeAPI structure)
interface Move {
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  type: { name: string; url: string };
  damage_class: { name: string; url: string }; // physical, special, status
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  // Add other relevant fields like target, priority, etc. if needed
}

interface MoveListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: { name: string; url: string }[];
}

const API_BASE_URL = "https://pokeapi.co/api/v2";

async function fetchMoveDetails(url: string): Promise<Move> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch move details from ${url}`);
  }
  return response.json();
}

const MoveDatabasePage: React.FC = () => {
  const [allMovesSimple, setAllMovesSimple] = useState<{ name: string; url: string }[]>([]);
  const [movesDetails, setMovesDetails] = useState<Move[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const movesPerPage = 20;

  // 1. Initialize state with safe defaults
  // 2. In useEffect, update state from localStorage if needed
  // 3. All localStorage and window access should be inside useEffect or event handlers only

  // Fetch all move names and URLs first
  useEffect(() => {
    const loadAllMoveNames = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // PokeAPI has ~900 moves, fetch all names for filtering
        const response = await fetch(`${API_BASE_URL}/move?limit=1000`); 
        if (!response.ok) throw new Error("Failed to fetch initial move list");
        const data: MoveListResponse = await response.json();
        setAllMovesSimple(data.results);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Could not load move names.");
        console.error(err);
      }
      setIsLoading(false);
    };
    loadAllMoveNames();
  }, []);

  const filteredMovesByName = useMemo(() => {
    return allMovesSimple.filter(move => 
      move.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allMovesSimple, searchTerm]);

  // Fetch details for the current page of filtered moves
  useEffect(() => {
    if (filteredMovesByName.length === 0 && !isLoading) return;

    const fetchCurrentPageMoveDetails = async () => {
      setIsLoading(true);
      const startIndex = (currentPage - 1) * movesPerPage;
      const endIndex = startIndex + movesPerPage;
      const movesToFetch = filteredMovesByName.slice(startIndex, endIndex);
      
      try {
        const detailedMovesPromises = movesToFetch.map(move => fetchMoveDetails(move.url));
        const resolvedMoves = await Promise.all(detailedMovesPromises);
        
        // Apply type and category filters after fetching details
        let finalFilteredMoves = resolvedMoves;
        if (typeFilter !== "all") {
          finalFilteredMoves = finalFilteredMoves.filter(m => m.type.name === typeFilter);
        }
        if (categoryFilter !== "all") {
          finalFilteredMoves = finalFilteredMoves.filter(m => m.damage_class.name === categoryFilter);
        }
        setMovesDetails(finalFilteredMoves);
      } catch (err: unknown) {
        setError("Failed to load some move details. Please try refreshing.");
        console.error(err);
        setMovesDetails([]); // Clear previous details on error
      }
      setIsLoading(false);
    };

    if (filteredMovesByName.length > 0) {
        fetchCurrentPageMoveDetails();
    }
  }, [filteredMovesByName, currentPage, movesPerPage, typeFilter, categoryFilter, isLoading]); // Added isLoading to deps to avoid loop

  const totalPages = Math.ceil(filteredMovesByName.length / movesPerPage);

  const getTypeColor = (type: string): string => `type-${type.toLowerCase()}`;
  const getCategoryColor = (category: string): string => {
    if (category === "physical") return "bg-red-500";
    if (category === "special") return "bg-blue-500";
    if (category === "status") return "bg-gray-500";
    return "bg-gray-300";
  };

  const pokemonTypes = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", 
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];
  const moveCategories = ["physical", "special", "status"];

  if (error && !isLoading && allMovesSimple.length === 0) {
    return <div className="text-center text-red-500 p-8">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-center mb-8">
        Move Database
      </motion.h1>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search moves..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none md:col-span-1"
        />
        <select 
          value={typeFilter} 
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Types</option>
          {pokemonTypes.map(type => <option key={type} value={type} className="capitalize">{type}</option>)}
        </select>
        <select 
          value={categoryFilter} 
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Categories</option>
          {moveCategories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
        </select>
      </div>

      {isLoading && movesDetails.length === 0 && <p className="text-center py-8">Loading moves...</p>}
      {!isLoading && movesDetails.length === 0 && searchTerm && <p className="text-center py-8">No moves found matching your criteria.</p>}
      
      {/* Moves Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {movesDetails.map((move, index) => (
            <motion.div
              key={move.name + index} // Ensure unique key if names can repeat due to pagination logic
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col"
            >
              <h3 className="font-bold capitalize text-xl mb-2 truncate" title={move.name}>{move.name}</h3>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full text-white ${getTypeColor(move.type.name)}`}>{move.type.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-white ${getCategoryColor(move.damage_class.name)}`}>{move.damage_class.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm mb-2">
                <span>Power: <span className="font-semibold">{move.power ?? "-"}</span></span>
                <span>Acc: <span className="font-semibold">{move.accuracy ?? "-"}</span></span>
                <span>PP: <span className="font-semibold">{move.pp ?? "-"}</span></span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 flex-grow min-h-[40px]">
                {move.effect_entries.find(e => e.language.name === "en")?.short_effect || "No effect description available."}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !isLoading && movesDetails.length > 0 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <motion.button whileTap={{scale:0.9}} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">Prev</motion.button>
          <span>Page {currentPage} of {totalPages}</span>
          <motion.button whileTap={{scale:0.9}} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">Next</motion.button>
        </div>
      )}
    </div>
  );
};

export default MoveDatabasePage;

