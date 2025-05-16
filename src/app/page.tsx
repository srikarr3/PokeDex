'use client';
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchPokemonList,
  fetchPokemonDetails,
  PokemonListResponse,
  PokemonDetails,
  getPokemonIdFromUrl,
} from "@/lib/pokeapi";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconOutline, MagnifyingGlassIcon, ArrowPathIcon, ChevronUpIcon, ChevronDownIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 20;

// Favorites Management (copied from previous implementation)
const getFavoritePokemons = (): string[] => {
  if (typeof window === "undefined") return [];
  const favorites = localStorage.getItem("favoritePokemons");
  return favorites ? JSON.parse(favorites) : [];
};

const addFavoritePokemon = (pokemonId: string) => {
  if (typeof window === "undefined") return;
  const favorites = getFavoritePokemons();
  if (!favorites.includes(pokemonId)) {
    localStorage.setItem("favoritePokemons", JSON.stringify([...favorites, pokemonId]));
    const count = parseInt(localStorage.getItem("favoritesCount") || "0");
    localStorage.setItem("favoritesCount", (count + 1).toString());
    window.dispatchEvent(new CustomEvent("achievementsUpdated"));
    window.dispatchEvent(new CustomEvent("favoritesUpdated"));
  }
};

const removeFavoritePokemon = (pokemonId: string) => {
  if (typeof window === "undefined") return;
  let favorites = getFavoritePokemons();
  favorites = favorites.filter(id => id !== pokemonId);
  localStorage.setItem("favoritePokemons", JSON.stringify(favorites));
  window.dispatchEvent(new CustomEvent("achievementsUpdated"));
  window.dispatchEvent(new CustomEvent("favoritesUpdated"));
};

interface SortConfig {
  key: string; // 'id', 'name', 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed', 'total'
  direction: "asc" | "desc";
}

const HomePage: React.FC = () => {
  const [allPokemonNames, setAllPokemonNames] = useState<{ name: string; url: string }[]>([]);
  const [displayedPokemonDetails, setDisplayedPokemonDetails] = useState<PokemonDetails[]>([]);
  const [pokemonDetailsCache, setPokemonDetailsCache] = useState<Record<string, PokemonDetails>>({});
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTypeFilters, setActiveTypeFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "id", direction: "asc" });
  const [showFilterSortModal, setShowFilterSortModal] = useState(false);

  useEffect(() => {
    setFavorites(getFavoritePokemons());
    const handleFavoritesUpdate = () => setFavorites(getFavoritePokemons());
    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
  }, []);

  const toggleFavorite = (pokemonId: string) => {
    if (typeof window === "undefined") return;
    if (favorites.includes(pokemonId)) {
      removeFavoritePokemon(pokemonId);
    } else {
      addFavoritePokemon(pokemonId);
    }
    setFavorites(getFavoritePokemons());
  };

  const fetchAllPokemonNames = useCallback(async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const data: PokemonListResponse = await fetchPokemonList(1500, 0);
      setAllPokemonNames(data.results);
    } catch (err) {
      console.error("Failed to fetch Pokémon list:", err);
      setError("Could not load Pokémon list. Please try again.");
    }
    setIsLoadingList(false);
  }, []);

  useEffect(() => {
    fetchAllPokemonNames();
  }, [fetchAllPokemonNames]);

  const baseFilteredPokemon = useMemo(() => {
    let pokemonToFilter = [...allPokemonNames]; // Create a new array for sorting

    if (showFavoritesOnly) {
      pokemonToFilter = pokemonToFilter.filter(p => favorites.includes(getPokemonIdFromUrl(p.url)));
    }

    if (searchTerm) {
      pokemonToFilter = pokemonToFilter.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by ID or Name (applied to the list of names/URLs)
    if (sortConfig.key === "id") {
      pokemonToFilter.sort((a, b) => {
        const idA = parseInt(getPokemonIdFromUrl(a.url));
        const idB = parseInt(getPokemonIdFromUrl(b.url));
        return sortConfig.direction === "asc" ? idA - idB : idB - idA;
      });
    } else if (sortConfig.key === "name") {
      pokemonToFilter.sort((a, b) => {
        return sortConfig.direction === "asc" 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      });
    }
    // Stat-based sorting will be applied after details are fetched for the current page

    return pokemonToFilter;
  }, [allPokemonNames, searchTerm, showFavoritesOnly, favorites, sortConfig]);

  useEffect(() => {
    if (baseFilteredPokemon.length === 0 && !isLoadingList) {
      setDisplayedPokemonDetails([]);
      return;
    }

    const fetchCurrentPageDetails = async () => {
      setIsLoadingDetails(true);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const currentBatchUrls = baseFilteredPokemon.slice(startIndex, endIndex);
      let newDetails: PokemonDetails[] = [];
      let newCache = { ...pokemonDetailsCache };
      let cacheChanged = false;

      for (const { name, url } of currentBatchUrls) {
        const pokemonId = getPokemonIdFromUrl(url);
        if (newCache[pokemonId]) {
          newDetails.push(newCache[pokemonId]);
        } else {
          try {
            const details = await fetchPokemonDetails(pokemonId);
            newDetails.push(details);
            newCache[pokemonId] = details;
            cacheChanged = true;
          } catch (fetchError) {
            console.error(`Failed to fetch details for ${name}:`, fetchError);
          }
        }
      }
      if (cacheChanged) setPokemonDetailsCache(newCache);

      // Apply multi-type filter (AND logic)
      if (activeTypeFilters.length > 0) {
        newDetails = newDetails.filter(p => 
          activeTypeFilters.every(st => p.types.some(t => t.type.name === st))
        );
      }

      // Apply stat-based sorting to the current page's details
      if (["hp", "attack", "defense", "special-attack", "special-defense", "speed", "total"].includes(sortConfig.key)) {
        newDetails.sort((a, b) => {
          let valA: number, valB: number;
          if (sortConfig.key === "total") {
            valA = a.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
            valB = b.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
          } else {
            valA = a.stats.find(s => s.stat.name === sortConfig.key)?.base_stat || 0;
            valB = b.stats.find(s => s.stat.name === sortConfig.key)?.base_stat || 0;
          }
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        });
      }

      setDisplayedPokemonDetails(newDetails);
      setIsLoadingDetails(false);
    };

    if (baseFilteredPokemon.length > 0) {
      fetchCurrentPageDetails();
    }
  }, [baseFilteredPokemon, currentPage, activeTypeFilters, sortConfig, isLoadingList]);

  const totalPages = Math.ceil(baseFilteredPokemon.length / ITEMS_PER_PAGE);

  const handleRetry = () => {
    fetchAllPokemonNames();
  };

  const handleTypeFilterChange = (type: string) => {
    setActiveTypeFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const handleSortChange = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
    setCurrentPage(1);
  };

  const pokemonTypes = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", 
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];
  const sortableKeys = [
      { key: "id", label: "ID" }, { key: "name", label: "Name" },
      { key: "hp", label: "HP"}, { key: "attack", label: "Attack" }, 
      { key: "defense", label: "Defense" }, { key: "special-attack", label: "Sp. Atk" },
      { key: "special-defense", label: "Sp. Def" }, { key: "speed", label: "Speed" },
      { key: "total", label: "Total Stats"}
  ];

  const getTypeColor = (type: string): string => `type-${type.toLowerCase()}`;

  if (isLoadingList && allPokemonNames.length === 0) {
    return <div className="flex justify-center items-center h-screen"><ArrowPathIcon className="w-12 h-12 animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button onClick={handleRetry} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold text-center my-8 tracking-tight">
        Pokédex
      </motion.h1>

      {/* Search and Filter/Sort Controls Trigger */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-xl rounded-lg flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full p-3 pl-10 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 outline-none transition-all"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <button 
          onClick={() => {setShowFavoritesOnly(!showFavoritesOnly); setCurrentPage(1);}}
          className={`p-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${showFavoritesOnly ? "bg-pink-500 text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-pink-100 dark:hover:bg-pink-800"}`}
          >
          {showFavoritesOnly ? <HeartIconSolid className="w-5 h-5"/> : <HeartIconOutline className="w-5 h-5"/>} 
          Favorites
        </button>
        <button 
          onClick={() => setShowFilterSortModal(true)}
          className="p-3 rounded-lg font-medium transition-colors flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5"/> Filters & Sort
        </button>
      </div>

      {/* Filter & Sort Modal */}
      <AnimatePresence>
        {showFilterSortModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
            onClick={() => setShowFilterSortModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" 
              onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Filters & Sorting</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Filter by Type (AND logic)</h3>
                <div className="flex flex-wrap gap-2">
                  {pokemonTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeFilterChange(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 shadow-sm border-2 
                                  ${activeTypeFilters.includes(type) 
                                    ? `${getTypeColor(type)} text-white border-transparent ring-2 ring-offset-1 dark:ring-offset-gray-800 ring-current` 
                                    : `bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 ${getTypeColor(type)}-hover-text`}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {activeTypeFilters.length > 0 && 
                    <button onClick={() => {setActiveTypeFilters([]); setCurrentPage(1);}} className="mt-3 text-xs text-blue-500 hover:underline">Clear Type Filters</button>}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Sort by</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sortableKeys.map(item => (
                    <button
                      key={item.key}
                      onClick={() => handleSortChange(item.key)}
                      className={`p-2 rounded-md text-sm font-medium transition-colors w-full text-left flex items-center justify-between 
                                  ${sortConfig.key === item.key 
                                    ? "bg-blue-500 text-white shadow-md" 
                                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"}`}
                    >
                      {item.label}
                      {sortConfig.key === item.key && (
                        sortConfig.direction === "asc" ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowFilterSortModal(false)} className="mt-8 w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors">Apply & Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pokémon Grid */}
      {isLoadingDetails && <div className="text-center py-6"><ArrowPathIcon className="w-8 h-8 animate-spin mx-auto" /></div>}
      {!isLoadingDetails && displayedPokemonDetails.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10 text-lg">
          No Pokémon match your current filters.
        </p>
      )}

      <AnimatePresence>
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {displayedPokemonDetails.map((pokemon, index) => (
            <motion.div
              key={pokemon.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 group relative"
            >
              <Link 
                href={`/creature/${pokemon.id}`}
                className="block relative"
              >
                <div className={`p-4 ${getTypeColor(pokemon.types[0].type.name)}-light-bg dark:bg-opacity-20 aspect-square flex items-center justify-center`}>
                  <motion.img
                    src={pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default || "/images/pokeball.png"}
                    alt={pokemon.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    layoutId={`pokemon-image-${pokemon.id}`}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-bold capitalize truncate text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {pokemon.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    #{String(pokemon.id).padStart(3, "0")}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {pokemon.types && pokemon.types.length > 0 ? (
                      pokemon.types.map(typeInfo => (
                        <span
                          key={typeInfo.type.name}
                          className={`px-2.5 py-1 text-[10px] rounded-full font-semibold text-white shadow-sm ${getTypeColor(typeInfo.type.name)}`}
                        >
                          {typeInfo.type.name.toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Loading...</span>
                    )}
                  </div>
                </div>
              </Link>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(String(pokemon.id));
                }}
                className="absolute top-3 right-3 p-1.5 bg-white/70 dark:bg-gray-700/70 rounded-full hover:bg-white dark:hover:bg-gray-600 transition-colors backdrop-blur-sm z-10"
                aria-label={favorites.includes(String(pokemon.id)) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.includes(String(pokemon.id)) ? 
                  <HeartIconSolid className="w-5 h-5 text-pink-500" /> : 
                  <HeartIconOutline className="w-5 h-5 text-pink-500/70 hover:text-pink-500" />
                }
              </button>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination Controls */}
      {totalPages > 1 && !isLoadingDetails && displayedPokemonDetails.length > 0 && (
        <div className="flex justify-center items-center mt-10 space-x-3">
          <motion.button whileTap={{scale:0.9}} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow disabled:opacity-60 transition-colors font-medium">Prev</motion.button>
          <span className="text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
          <motion.button whileTap={{scale:0.9}} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow disabled:opacity-60 transition-colors font-medium">Next</motion.button>
        </div>
      )}
    </div>
  );
};

export default HomePage;

// Add to globals.css or a style tag in layout for hover text color for types
/*
.type-normal-hover-text:hover { color: #A8A878 !important; border-color: #A8A878 !important; }
.type-fire-hover-text:hover { color: #F08030 !important; border-color: #F08030 !important; }
.type-water-hover-text:hover { color: #6890F0 !important; border-color: #6890F0 !important; }
.type-electric-hover-text:hover { color: #F8D030 !important; border-color: #F8D030 !important; }
.type-grass-hover-text:hover { color: #78C850 !important; border-color: #78C850 !important; }
.type-ice-hover-text:hover { color: #98D8D8 !important; border-color: #98D8D8 !important; }
.type-fighting-hover-text:hover { color: #C03028 !important; border-color: #C03028 !important; }
.type-poison-hover-text:hover { color: #A040A0 !important; border-color: #A040A0 !important; }
.type-ground-hover-text:hover { color: #E0C068 !important; border-color: #E0C068 !important; }
.type-flying-hover-text:hover { color: #A890F0 !important; border-color: #A890F0 !important; }
.type-psychic-hover-text:hover { color: #F85888 !important; border-color: #F85888 !important; }
.type-bug-hover-text:hover { color: #A8B820 !important; border-color: #A8B820 !important; }
.type-rock-hover-text:hover { color: #B8A038 !important; border-color: #B8A038 !important; }
.type-ghost-hover-text:hover { color: #705898 !important; border-color: #705898 !important; }
.type-dragon-hover-text:hover { color: #7038F8 !important; border-color: #7038F8 !important; }
.type-dark-hover-text:hover { color: #705848 !important; border-color: #705848 !important; }
.type-steel-hover-text:hover { color: #B8B8D0 !important; border-color: #B8B8D0 !important; }
.type-fairy-hover-text:hover { color: #EE99AC !important; border-color: #EE99AC !important; }
*/

