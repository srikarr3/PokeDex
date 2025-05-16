'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPokemonList, fetchPokemonDetails, PokemonDetails } from '@/lib/pokeapi';
import { ArrowDownTrayIcon, FolderIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface SavedTeam {
  name: string;
  members: PokemonDetails[];
}

const MAX_TEAM_SIZE = 6;

const TeamBuilderPage: React.FC = () => {
  const [team, setTeam] = useState<PokemonDetails[]>([]);
  const [allPokemon, setAllPokemon] = useState<{ name: string; url: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [teamName, setTeamName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  useEffect(() => {
    const loadAllPokemon = async () => {
      setIsLoadingList(true);
      try {
        // Fetch a large limit to get most/all Pokémon for selection
        const data = await fetchPokemonList(1500, 0); 
        setAllPokemon(data.results);
      } catch (error) {
        console.error("Failed to fetch Pokémon list for team builder:", error);
        // Handle error appropriately in UI
      }
      setIsLoadingList(false);
    };
    loadAllPokemon();
  }, []);

  useEffect(() => {
    const loaded = localStorage.getItem('savedPokedexTeams');
    if (loaded) {
      setSavedTeams(JSON.parse(loaded));
    }
  }, []);

  const addPokemonToTeam = async (pokemonNameOrId: string) => {
    if (team.length >= MAX_TEAM_SIZE) {
      alert('Team is full!');
      return;
    }
    if (team.find(p => p.name.toLowerCase() === pokemonNameOrId.toLowerCase() || p.id.toString() === pokemonNameOrId)) {
        alert('This Pokémon is already in your team!');
        return;
    }

    setIsLoadingDetails(true);
    try {
      const details = await fetchPokemonDetails(pokemonNameOrId.toLowerCase());
      setTeam(prevTeam => [...prevTeam, details]);
    } catch (error) {
      console.error(`Failed to fetch details for ${pokemonNameOrId}:`, error);
      alert(`Could not add ${pokemonNameOrId}. Please check the name/ID.`);
    }
    setIsLoadingDetails(false);
    setSearchTerm(''); // Clear search term after adding
  };

  const removePokemonFromTeam = (pokemonId: number) => {
    setTeam(prevTeam => prevTeam.filter(p => p.id !== pokemonId));
  };

  const handleSaveTeam = () => {
    if (!teamName.trim()) {
      alert('Please enter a name for your team.');
      return;
    }
    const newSavedTeam: SavedTeam = { name: teamName, members: team };
    const updatedSavedTeams = [...savedTeams.filter(st => st.name !== teamName), newSavedTeam];
    setSavedTeams(updatedSavedTeams);
    localStorage.setItem('savedPokedexTeams', JSON.stringify(updatedSavedTeams));
    setShowSaveModal(false);
    setTeamName('');
    alert('Team saved!');
  };

  const loadTeam = (selectedTeam: SavedTeam) => {
    setTeam(selectedTeam.members);
    setShowLoadModal(false);
    alert(`Team '${selectedTeam.name}' loaded!`);
  };

  const deleteSavedTeam = (teamNameToDelete: string) => {
    const updatedSavedTeams = savedTeams.filter(st => st.name !== teamNameToDelete);
    setSavedTeams(updatedSavedTeams);
    localStorage.setItem('savedPokedexTeams', JSON.stringify(updatedSavedTeams));
    alert(`Team '${teamNameToDelete}' deleted.`);
    if (updatedSavedTeams.length === 0) setShowLoadModal(false);
  }

  const filteredPokemon = searchTerm
    ? allPokemon.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="container mx-auto p-4">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-center mb-8">
        Team Builder
      </motion.h1>

      {/* Pokémon Selection */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-3">Add Pokémon to your Team ({team.length}/{MAX_TEAM_SIZE})</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            placeholder="Search Pokémon by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {isLoadingDetails && <p className="self-center">Loading details...</p>}
        </div>
        {searchTerm && !isLoadingList && (
          <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
            {filteredPokemon.length > 0 ? (
              filteredPokemon.slice(0, 10).map(p => (
                <button
                  key={p.name}
                  onClick={() => addPokemonToTeam(p.name)}
                  disabled={isLoadingDetails || team.length >= MAX_TEAM_SIZE}
                  className="block w-full text-left p-2 hover:bg-gray-200 dark:hover:bg-gray-600 capitalize disabled:opacity-50"
                >
                  {p.name}
                </button>
              ))
            ) : (
              <p className="p-2 text-gray-500">No Pokémon found matching &quot;{searchTerm}&quot;.</p>
            )}
          </div>
        )}
        {isLoadingList && <p>Loading Pokémon list...</p>}
      </div>

      {/* Current Team Display */}
      <div className="mb-6">
        <h2 className="text-3xl font-semibold mb-4">Your Team</h2>
        {team.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Your team is empty. Add some Pokémon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <AnimatePresence>
              {team.map((member, index) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md flex flex-col items-center text-center"
                >
                  <Image src={member.sprites.front_default || '/images/pokeball.png'} alt={member.name} width={96} height={96} className="w-24 h-24 mb-2" />
                  <h3 className="font-semibold capitalize text-lg mb-1">{member.name}</h3>
                  <div className="flex flex-wrap justify-center gap-1 mb-2">
                    {member.types.map(typeInfo => (
                      <span key={typeInfo.type.name} className={`px-2 py-0.5 text-xs rounded-full type-${typeInfo.type.name.toLowerCase()} text-white`}>
                        {typeInfo.type.name}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => removePokemonFromTeam(member.id)} className="mt-auto p-1.5 bg-red-500 hover:bg-red-700 text-white rounded-full text-xs">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Save/Load Team Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowSaveModal(true)}
          disabled={team.length === 0}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="w-5 h-5" /> Save Team
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowLoadModal(true)}
          disabled={savedTeams.length === 0}
          className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50"
        >
          <FolderIcon className="w-5 h-5" /> Load Team
        </motion.button>
      </div>

      {/* Save Team Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md"
            >
              <h3 className="text-xl font-semibold mb-4">Save Current Team</h3>
              <input 
                type="text"
                placeholder="Enter team name..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                <button onClick={handleSaveTeam} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load Team Modal */}
      <AnimatePresence>
        {showLoadModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
            >
              <h3 className="text-xl font-semibold mb-4">Load a Saved Team</h3>
              {savedTeams.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {savedTeams.map(st => (
                    <li key={st.name} className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                      <span className="font-medium">{st.name}</span>
                      <div className='flex gap-2'>
                        <button onClick={() => loadTeam(st)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded">Load</button>
                        <button onClick={() => deleteSavedTeam(st.name)} className="p-1.5 bg-red-500 hover:bg-red-700 text-white rounded-full">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No teams saved yet.</p>
              )}
              <div className="flex justify-end mt-4">
                <button onClick={() => setShowLoadModal(false)} className="px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TeamBuilderPage;

