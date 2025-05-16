"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fetchPokemonList, fetchPokemonDetails, PokemonDetails, fetchPokemonSpecies, PokemonSpecies } from "@/lib/pokeapi";
import Image from 'next/image';

const BreedingCalculatorPage: React.FC = () => {
  const [allPokemonList, setAllPokemonList] = useState<{ name: string; url: string }[]>([]);
  const [parent1, setParent1] = useState<PokemonSpecies | null>(null);
  const [parent2, setParent2] = useState<PokemonSpecies | null>(null);
  const [parent1Details, setParent1Details] = useState<PokemonDetails | null>(null);
  const [parent2Details, setParent2Details] = useState<PokemonDetails | null>(null);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [compatibilityMessage, setCompatibilityMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadList = async () => {
      try {
        const data = await fetchPokemonList(1500, 0); // Fetch a large list for selection
        setAllPokemonList(data.results);
      } catch (error) {
        console.error("Failed to load Pokémon list for breeding:", error);
      }
    };
    loadList();
  }, []);

  const loadPokemonData = async (pokemonNameOrId: string, setParentSpecies: (species: PokemonSpecies | null) => void, setParentDetails: (details: PokemonDetails | null) => void) => {
    setIsLoading(true);
    try {
      const details = await fetchPokemonDetails(pokemonNameOrId.toLowerCase());
      const species = await fetchPokemonSpecies(details.species.url.split("/").slice(-2, -1)[0]);
      setParentDetails(details);
      setParentSpecies(species);
    } catch (error) {
      console.error(`Failed to load data for ${pokemonNameOrId}:`, error);
      setParentDetails(null);
      setParentSpecies(null);
      alert(`Could not load Pokémon: ${pokemonNameOrId}. Please check name/ID.`);
    }
    setIsLoading(false);
  };

  const checkCompatibility = useCallback(() => {
    if (!parent1 || !parent2) {
      setCompatibilityMessage("Please select two Pokémon to check compatibility.");
      return;
    }

    const parent1EggGroups = parent1.egg_groups.map(eg => eg.name);
    const parent2EggGroups = parent2.egg_groups.map(eg => eg.name);

    // Ditto is compatible with almost anything (except other Dittos or Undiscovered group)
    if (parent1.name === "ditto" && parent2.name !== "ditto" && !parent2EggGroups.includes("no-eggs")) {
        setCompatibilityMessage(`${parent1Details?.name} (Ditto) and ${parent2Details?.name} are compatible for breeding!`);
        return;
    }
    if (parent2.name === "ditto" && parent1.name !== "ditto" && !parent1EggGroups.includes("no-eggs")) {
        setCompatibilityMessage(`${parent1Details?.name} and ${parent2Details?.name} (Ditto) are compatible for breeding!`);
        return;
    }
    if (parent1.name === "ditto" && parent2.name === "ditto"){
        setCompatibilityMessage("Two Dittos cannot breed with each other.");
        return;
    }

    if (parent1EggGroups.includes("no-eggs") || parent2EggGroups.includes("no-eggs")) {
      setCompatibilityMessage("One or both Pokémon are in the Undiscovered egg group and cannot breed.");
      return;
    }

    const sharedEggGroup = parent1EggGroups.some(group => parent2EggGroups.includes(group));

    if (sharedEggGroup) {
      // Check gender compatibility (simplified: assume different genders or one is genderless and not ditto)
      // PokeAPI species data doesn_t directly give gender for the *instance* of the pokemon, but gender_rate for species.
      // For simplicity, we assume if they share an egg group (and not Undiscovered), they are compatible.
      // A full check would involve gender_rate and potentially specific genderless breeding rules.
      setCompatibilityMessage(`${parent1Details?.name} and ${parent2Details?.name} share an egg group and are likely compatible for breeding!`);
    } else {
      setCompatibilityMessage(`${parent1Details?.name} and ${parent2Details?.name} do not share a common egg group and are not compatible.`);
    }
  }, [parent1, parent2, parent1Details, parent2Details]);

  useEffect(() => {
    if (parent1 && parent2) {
      checkCompatibility();
    }
  }, [parent1, parent2, checkCompatibility]);

  const renderPokemonSelector = ( 
    parentDetails: PokemonDetails | null, 
    searchTerm: string, 
    setSearchTerm: (term: string) => void,
    handleSelect: (name: string | null) => void,
    title: string
  ) => {
    const filteredList = searchTerm
      ? allPokemonList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : [];

    return (
      <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg w-full md:w-2/5">
        <h2 className="text-xl font-semibold mb-3 text-center">{title}</h2>
        {parentDetails ? (
          <div className="text-center mb-3">
            <Image src={parentDetails.sprites.front_default || "/images/pokeball.png"} alt={parentDetails.name} className="w-24 h-24 mx-auto mb-2" width={96} height={96}/>
            <p className="font-bold capitalize text-lg">{parentDetails.name}</p>
            <button onClick={() => handleSelect(null)} className="text-xs text-red-500 hover:underline mt-1">Clear</button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
                {filteredList.length > 0 ? (
                  filteredList.slice(0, 5).map(p => (
                    <button
                      key={p.name}
                      onClick={() => { handleSelect(p.name); setSearchTerm(""); }}
                      disabled={isLoading}
                      className="block w-full text-left p-2 hover:bg-gray-200 dark:hover:bg-gray-600 capitalize disabled:opacity-50"
                    >
                      {p.name}
                    </button>
                  ))
                ) : (
                  <p className="p-2 text-gray-500">No results.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-center mb-8">
        Breeding Calculator (Simplified)
      </motion.h1>

      <div className="flex flex-col md:flex-row justify-around items-start mb-6 gap-4">
        {renderPokemonSelector(parent1Details, searchTerm1, setSearchTerm1, (name: string | null) => name ? loadPokemonData(name, setParent1, setParent1Details) : (setParent1(null), setParent1Details(null)), "Select Parent 1")}
        <div className="text-3xl font-bold self-center p-4">+</div>
        {renderPokemonSelector(parent2Details, searchTerm2, setSearchTerm2, (name: string | null) => name ? loadPokemonData(name, setParent2, setParent2Details) : (setParent2(null), setParent2Details(null)), "Select Parent 2")}
      </div>

      {isLoading && <p className="text-center py-4">Loading Pokémon data...</p>}

      {parent1 && parent2 && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="mt-8 p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg text-center"
        >
          <h3 className="text-2xl font-semibold mb-3">Compatibility Result:</h3>
          <p className="text-lg">{compatibilityMessage}</p>
          {parent1Details && parent2Details && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p className="capitalize">{parent1Details.name} Egg Groups: {parent1?.egg_groups.map(eg => eg.name).join(", ") || "N/A"}</p>
                <p className="capitalize">{parent2Details.name} Egg Groups: {parent2?.egg_groups.map(eg => eg.name).join(", ") || "N/A"}</p>
            </div>
          )}
        </motion.div>
      )}
      {!parent1 || !parent2 && !isLoading && (
         <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Please select two Pokémon to check their breeding compatibility.</p>
      )}

    </div>
  );
};

export default BreedingCalculatorPage;

