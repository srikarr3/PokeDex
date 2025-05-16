"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchPokemonDetails,
  fetchPokemonSpecies,
  fetchEvolutionChain,
  PokemonDetails,
  PokemonSpecies,
  EvolutionChain,
  EvolutionLink,
  getPokemonIdFromUrl
} from '@/lib/pokeapi';
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { motion } from 'framer-motion';
import typeChartData from "@/data/typeChart.json"; // Import the type chart
import Image from 'next/image';

// Favorites Management
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
    window.dispatchEvent(new CustomEvent("favoritesUpdated"));
    const count = parseInt(localStorage.getItem("favoritesCount") || "0");
    localStorage.setItem("favoritesCount", (count + 1).toString());
    window.dispatchEvent(new CustomEvent("achievementsUpdated"));
  }
};

const removeFavoritePokemon = (pokemonId: string) => {
  if (typeof window === "undefined") return;
  let favorites = getFavoritePokemons();
  favorites = favorites.filter(id => id !== pokemonId);
  localStorage.setItem("favoritePokemons", JSON.stringify(favorites));
  window.dispatchEvent(new CustomEvent("favoritesUpdated"));
  window.dispatchEvent(new CustomEvent("achievementsUpdated"));
};

const POKEMON_TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-400 text-white type-normal',
  fire: 'bg-red-500 text-white type-fire',
  water: 'bg-blue-500 text-white type-water',
  electric: 'bg-yellow-400 text-black type-electric',
  grass: 'bg-green-500 text-white type-grass',
  ice: 'bg-cyan-300 text-black type-ice',
  fighting: 'bg-orange-700 text-white type-fighting',
  poison: 'bg-purple-500 text-white type-poison',
  ground: 'bg-yellow-600 text-black type-ground',
  flying: 'bg-indigo-300 text-white type-flying',
  psychic: 'bg-pink-500 text-white type-psychic',
  bug: 'bg-lime-500 text-black type-bug',
  rock: 'bg-yellow-700 text-white type-rock',
  ghost: 'bg-indigo-800 text-white type-ghost',
  dragon: 'bg-purple-700 text-white type-dragon',
  dark: 'bg-gray-700 text-white type-dark',
  steel: 'bg-gray-500 text-black type-steel',
  fairy: 'bg-pink-300 text-black type-fairy',
  unknown: 'bg-gray-300 text-black type-unknown',
  shadow: 'bg-gray-900 text-white type-shadow',
};

const getTypeClass = (type: string): string => `type-${type.toLowerCase()}`;

interface StatDisplayProps {
  label: string;
  value: number;
  maxValue?: number;
}

const StatDisplay: React.FC<StatDisplayProps> = ({ label, value, maxValue = 255 }) => {
  const percentage = (value / maxValue) * 100;
  let barColor = 'bg-gray-300 dark:bg-gray-600';
  if (percentage > 66) barColor = 'bg-green-500';
  else if (percentage > 33) barColor = 'bg-yellow-400';
  else barColor = 'bg-red-500';

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{label.replace('-', ' ')}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <motion.div
          className={`${barColor} h-2.5 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

interface EvolutionStageProps {
  evolutionLink: EvolutionLink;
  currentPokemonName: string;
}

const EvolutionStage: React.FC<EvolutionStageProps> = ({ evolutionLink, currentPokemonName }) => {
  const pokemonId = getPokemonIdFromUrl(evolutionLink.species.url);
  const isCurrent = evolutionLink.species.name === currentPokemonName;

  return (
    <div className="flex flex-col items-center text-center mx-2">
      <Link 
        href={`/creature/${pokemonId}`}
        className={`p-2 rounded-lg transition-all duration-200 ${isCurrent ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      >
        <Image 
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`} 
          alt={evolutionLink.species.name} 
          className="w-20 h-20 md:w-24 md:h-24 object-contain transition-transform hover:scale-110"
          onError={(e) => (e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`)}
          width={96}
          height={96}
        />
        <p className="mt-1 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{evolutionLink.species.name}</p>
      </Link>
      {evolutionLink.evolves_to.length > 0 && (
        <div className="flex mt-2 justify-center flex-wrap">
          {evolutionLink.evolves_to.map((nextEvolution, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-1 text-gray-400 dark:text-gray-500">/</span>}
              <EvolutionStage evolutionLink={nextEvolution} currentPokemonName={currentPokemonName} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TypeEffectiveness {
  takes4x: string[];
  takes2x: string[];
  takes1x: string[];
  takes0_5x: string[];
  takes0_25x: string[];
  takes0x: string[];
}

const calculateTypeEffectiveness = (pokemonTypes: string[]): TypeEffectiveness => {
  const effectiveness: TypeEffectiveness = {
    takes4x: [],
    takes2x: [],
    takes1x: [],
    takes0_5x: [],
    takes0_25x: [],
    takes0x: [],
  };

  const allAttackingTypes = typeChartData.map(t => t.name);

  allAttackingTypes.forEach(attackingType => {
    let multiplier = 1;
    const attackerChartEntry = typeChartData.find(t => t.name === attackingType);
    if (!attackerChartEntry) return;

    pokemonTypes.forEach(defendingType => {
      if (attackerChartEntry.strengths.includes(defendingType)) {
        multiplier *= 2;
      }
      if (attackerChartEntry.weaknesses.includes(defendingType)) {
        multiplier *= 0.5;
      }
      if (attackerChartEntry.immunes.includes(defendingType)) {
        multiplier *= 0;
      }
    });
    
    // If any part of the defending type is immune to the attacker, the final multiplier is 0
    // This check needs to be more robust for dual types where one type is immune and other is not.
    // The current loop structure correctly handles this: if multiplier becomes 0, it stays 0.

    if (multiplier === 0) effectiveness.takes0x.push(attackingType);
    else if (multiplier === 0.25) effectiveness.takes0_25x.push(attackingType);
    else if (multiplier === 0.5) effectiveness.takes0_5x.push(attackingType);
    else if (multiplier === 1) effectiveness.takes1x.push(attackingType);
    else if (multiplier === 2) effectiveness.takes2x.push(attackingType);
    else if (multiplier === 4) effectiveness.takes4x.push(attackingType);
  });

  return effectiveness;
};

interface TypeDisplaySectionProps {
  title: string;
  types: string[];
  multiplierText: string;
  bgColorClass?: string;
}

const TypeDisplaySection: React.FC<TypeDisplaySectionProps> = ({ title, types, multiplierText, bgColorClass = "bg-gray-100 dark:bg-gray-700" }) => {
  if (types.length === 0) return null;
  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`p-3 rounded-lg shadow-sm ${bgColorClass} mb-3`}>
      <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">{title} <span className="text-xs font-normal">({multiplierText})</span></h4>
      <div className="flex flex-wrap gap-1.5">
        {types.map(type => (
          <span key={type} className={`px-2.5 py-1 text-[10px] rounded-full font-semibold text-white shadow-sm ${getTypeClass(type)}`}>
            {type.toUpperCase()}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

const PokemonTypeWeaknesses: React.FC<{ types: { type: { name: string } }[] }> = ({ types }) => {
  const pokemonTypeNames = types.map(t => t.type.name);
  const effectiveness = useMemo(() => calculateTypeEffectiveness(pokemonTypeNames), [pokemonTypeNames]);

  return (
    <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Type Defenses</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <TypeDisplaySection title="Weak To (4x)" types={effectiveness.takes4x} multiplierText="x4 Damage" bgColorClass="bg-red-200 dark:bg-red-900" />
          <TypeDisplaySection title="Weak To (2x)" types={effectiveness.takes2x} multiplierText="x2 Damage" bgColorClass="bg-red-100 dark:bg-red-800" />
        </div>
        <div>
          <TypeDisplaySection title="Resists (0.5x)" types={effectiveness.takes0_5x} multiplierText="x0.5 Damage" bgColorClass="bg-green-100 dark:bg-green-800" />
          <TypeDisplaySection title="Resists (0.25x)" types={effectiveness.takes0_25x} multiplierText="x0.25 Damage" bgColorClass="bg-green-200 dark:bg-green-900" />
        </div>
      </div>
      <TypeDisplaySection title="Immune To (0x)" types={effectiveness.takes0x} multiplierText="x0 Damage" bgColorClass="bg-gray-200 dark:bg-gray-600" />
      {/* Optionally display normal effectiveness if needed, though it can be long */}
      {/* <TypeDisplaySection title="Normal Damage From" types={effectiveness.takes1x} multiplierText="x1 Damage" /> */}
    </div>
  );
};

export default function PokemonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pokemonId = params.id as string;

  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorites(getFavoritePokemons());
    const handleFavoritesUpdate = () => setFavorites(getFavoritePokemons());
    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
  }, []);

  useEffect(() => {
    // Reset state on navigation
    setPokemon(null);
    setSpecies(null);
    setEvolutionChain(null);
    setError(null);
    console.log('Navigated to Pokémon ID:', pokemonId);

    const fetchData = async () => {
      if (!mounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const [pokemonData, speciesData] = await Promise.all([
          fetchPokemonDetails(pokemonId),
          fetchPokemonSpecies(pokemonId)
        ]);
        setPokemon(pokemonData);
        setSpecies(speciesData);
        if (speciesData.evolution_chain?.url) {
          const evolutionData = await fetchEvolutionChain(speciesData.evolution_chain.url);
          setEvolutionChain(evolutionData);
        }
        // Track viewed Pokémon for achievements
        if (typeof window !== "undefined") {
          const viewedCount = parseInt(localStorage.getItem("pokemonViewedCount") || "0");
          localStorage.setItem("pokemonViewedCount", (viewedCount + 1).toString());
          window.dispatchEvent(new CustomEvent("achievementsUpdated"));
        }
      } catch (err) {
        console.error("Error fetching Pokémon data:", err);
        setError("Failed to load Pokémon data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [pokemonId, mounted]);

  const toggleFavorite = () => {
    if (!mounted) return;
    if (favorites.includes(pokemonId)) {
      removeFavoritePokemon(pokemonId);
    } else {
      addFavoritePokemon(pokemonId);
    }
    setFavorites(getFavoritePokemons());
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button 
          onClick={() => router.back()} 
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!pokemon || !species) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-500 text-xl mb-4">Pokémon not found</p>
        <button 
          onClick={() => router.back()} 
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const mainImage = pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default;
  const description = species?.flavor_text_entries
    .find(entry => entry.language.name === 'en')
    ?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') || 'No description available.';
  
  const primaryTypeClass = POKEMON_TYPE_COLORS[pokemon.types[0].type.name.toLowerCase()]?.split(' ')[0] || 'bg-gray-500';

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}} className="container mx-auto p-4 md:p-8 max-w-5xl">
      <button 
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 flex items-center group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back
      </button>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <div className={`p-6 md:p-8 ${primaryTypeClass} relative`}>
          <div className="flex justify-between items-start">
            <h1 className="text-4xl md:text-5xl font-bold capitalize text-white drop-shadow-md">{pokemon.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl md:text-4xl font-bold text-white opacity-80">#{String(pokemon.id).padStart(3, '0')}</span>
              <motion.button 
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={toggleFavorite}
                className="p-2 bg-white/30 dark:bg-black/30 rounded-full hover:bg-white/50 dark:hover:bg-black/50 backdrop-blur-sm transition-colors"
                aria-label={favorites.includes(pokemonId) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.includes(pokemonId) ? 
                  <HeartIconSolid className="w-7 h-7 text-pink-500" /> : 
                  <HeartIconOutline className="w-7 h-7 text-white hover:text-pink-400" />
                }
              </motion.button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {pokemon.types.map(typeInfo => (
              <span 
                key={typeInfo.type.name} 
                className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${POKEMON_TYPE_COLORS[typeInfo.type.name.toLowerCase()] || 'bg-gray-200 text-gray-800'}`}
              >
                {typeInfo.type.name.charAt(0).toUpperCase() + typeInfo.type.name.slice(1)}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-6">
              <Image 
                src={mainImage} 
                alt={pokemon.name} 
                className="object-contain drop-shadow-xl"
                fill
                sizes="(max-width: 768px) 256px, 320px"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = pokemon.sprites.front_default || '/images/pokeball.png';
                }}
              />
            </div>
            <div className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Pokédex Data</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <strong className="text-gray-600 dark:text-gray-400">Height:</strong> <span className="text-gray-800 dark:text-white">{(pokemon.height / 10).toFixed(1)} m</span>
                <strong className="text-gray-600 dark:text-gray-400">Weight:</strong> <span className="text-gray-800 dark:text-white">{(pokemon.weight / 10).toFixed(1)} kg</span>
                <strong className="text-gray-600 dark:text-gray-400 col-span-2">Abilities:</strong>
                {pokemon.abilities.map(abilityInfo => (
                  <span key={abilityInfo.ability.name} className="capitalize col-span-2 ml-2 text-gray-800 dark:text-white">
                    {abilityInfo.ability.name.replace('-', ' ')}{abilityInfo.is_hidden ? ' (Hidden)' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Base Stats</h3>
              {pokemon.stats.map(statInfo => (
                <StatDisplay key={statInfo.stat.name} label={statInfo.stat.name} value={statInfo.base_stat} />
              ))}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
        
        {/* Type Weaknesses/Resistances Display */}
        {pokemon && <PokemonTypeWeaknesses types={pokemon.types} />}

        {evolutionChain && evolutionChain.chain && (
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700 mt-6">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-gray-800 dark:text-white">Evolution Chain</h2>
            <div className="flex flex-wrap justify-center items-start overflow-x-auto pb-4">
              <EvolutionStage evolutionLink={evolutionChain.chain} currentPokemonName={pokemon.name} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

