'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchPokemonDetails, PokemonDetails, PokemonType } from '@/lib/pokeapi';
import typeChartData from '@/data/typeChart.json';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface TypeChartEntry {
  name: string;
  immunes: string[];
  weaknesses: string[]; // Attacker is weak to these types (takes 0.5x or 0.25x)
  strengths: string[]; // Attacker is strong against these types (deals 2x or 4x)
}

const typeChart: TypeChartEntry[] = typeChartData;

// Helper to get type effectiveness
const getTypeEffectiveness = (attackingType: string, defendingTypes: PokemonType[]): number => {
  let effectiveness = 1;
  const attackerInfo = typeChart.find(t => t.name.toLowerCase() === attackingType.toLowerCase());
  if (!attackerInfo) return 1;

  defendingTypes.forEach(defendingType => {
    const defTypeName = defendingType.type.name.toLowerCase();
    if (attackerInfo.strengths.map(s => s.toLowerCase()).includes(defTypeName)) {
      effectiveness *= 2;
    }
    if (attackerInfo.weaknesses.map(w => w.toLowerCase()).includes(defTypeName)) {
      effectiveness *= 0.5;
    }
    if (attackerInfo.immunes.map(i => i.toLowerCase()).includes(defTypeName)) {
      effectiveness *= 0;
    }
  });
  return effectiveness;
};

interface BattlePokemon {
  details: PokemonDetails;
  currentHp: number;
  maxHp: number;
}

const BattleSimulatorPage: React.FC = () => {
  const [pokemon1Id, setPokemon1Id] = useState<string>('1');
  const [pokemon2Id, setPokemon2Id] = useState<string>('4');
  const [pokemon1, setPokemon1] = useState<BattlePokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<BattlePokemon | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isBattling, setIsBattling] = useState<boolean>(false);
  const [attacker, setAttacker] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<string | null>(null);

  const loadPokemon = useCallback(async (id: string, setPokemonState: React.Dispatch<React.SetStateAction<BattlePokemon | null>>) => {
    try {
      const details = await fetchPokemonDetails(id);
      const hpStat = details.stats.find(stat => stat.stat.name === 'hp');
      const maxHp = hpStat ? hpStat.base_stat : 100;
      setPokemonState({ details, currentHp: maxHp, maxHp });
      return { details, currentHp: maxHp, maxHp };
    } catch (error) {
      console.error(`Failed to load pokemon ${id}:`, error);
      setBattleLog(prev => [...prev, `Error loading Pokémon ${id}.`]);
      setPokemonState(null);
      return null;
    }
  }, []);

  useEffect(() => {
    loadPokemon(pokemon1Id, setPokemon1);
  }, [pokemon1Id, loadPokemon]);

  useEffect(() => {
    loadPokemon(pokemon2Id, setPokemon2);
  }, [pokemon2Id, loadPokemon]);

  const startBattle = async () => {
    setBattleLog(['Battle started!']);
    setIsBattling(true);
    setWinner(null);
    // Reload Pokémon to reset HP
    const p1 = await loadPokemon(pokemon1Id, setPokemon1);
    const p2 = await loadPokemon(pokemon2Id, setPokemon2);
    if (p1 && p2) {
        // Determine who goes first (simple speed check for now)
        const speed1 = p1.details.stats.find(s => s.stat.name === 'speed')?.base_stat || 0;
        const speed2 = p2.details.stats.find(s => s.stat.name === 'speed')?.base_stat || 0;
        setAttacker(speed1 >= speed2 ? 1 : 2);
        setBattleLog(prev => [...prev, `${speed1 >= speed2 ? p1.details.name : p2.details.name} will attack first!`]);
    } else {
        setIsBattling(false);
        setBattleLog(prev => [...prev, 'Failed to load one or both Pokémon. Cannot start battle.']);
    }
  };

  const handleAttack = () => {
    if (!pokemon1 || !pokemon2 || winner) return;

    const currentAttacker = attacker === 1 ? pokemon1 : pokemon2;
    const currentDefender = attacker === 1 ? pokemon2 : pokemon1;
    const setDefenderState = attacker === 1 ? setPokemon2 : setPokemon1;

    if (currentAttacker.currentHp <= 0 || currentDefender.currentHp <= 0) {
        setBattleLog(prev => [...prev, 'Battle has already concluded.']);
        return;
    }

    // Simplified damage calculation
    // For simplicity, let's use the first move's type if available, otherwise normal type
    // And a fixed base power for the attack
    const attackStat = currentAttacker.details.stats.find(s => s.stat.name === 'attack')?.base_stat || 30;
    const defenseStat = currentDefender.details.stats.find(s => s.stat.name === 'defense')?.base_stat || 30;
    const attackingMoveType = currentAttacker.details.types[0]?.type.name || 'normal';
    
    const effectiveness = getTypeEffectiveness(attackingMoveType, currentDefender.details.types);
    let damage = Math.floor((( ( (2/5 + 2) * attackStat * 50 / defenseStat) / 50) + 2) * effectiveness);
    damage = Math.max(1, damage); // Ensure at least 1 damage

    const newHp = Math.max(0, currentDefender.currentHp - damage);
    setDefenderState(prev => prev ? { ...prev, currentHp: newHp } : null);

    let logMessage = `${currentAttacker.details.name} attacks ${currentDefender.details.name} with a ${attackingMoveType}-type move for ${damage} damage.`;
    if (effectiveness > 1) logMessage += ` It's super effective!`;
    if (effectiveness < 1 && effectiveness > 0) logMessage += ` It's not very effective...`;
    if (effectiveness === 0) logMessage += ` It has no effect!`;
    
    setBattleLog(prev => [...prev, logMessage]);

    if (newHp <= 0) {
      setBattleLog(prev => [...prev, `${currentDefender.details.name} fainted! ${currentAttacker.details.name} wins!`]);
      setWinner(currentAttacker.details.name);
      setIsBattling(false);
    } else {
      setAttacker(attacker === 1 ? 2 : 1); // Switch turns
      setBattleLog(prev => [...prev, `It's now ${attacker === 1 ? currentDefender.details.name : currentAttacker.details.name}'s turn.`]);
    }
  };

  const renderPokemon = (p: BattlePokemon | null, idSetter: React.Dispatch<React.SetStateAction<string>>, currentId: string) => {
    if (!p) return <div className="w-1/2 p-4 border rounded-lg dark:border-gray-700 text-center">Loading Pokémon...</div>;
    const hpPercentage = (p.currentHp / p.maxHp) * 100;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full md:w-1/2 p-4 border rounded-lg dark:border-gray-700 flex flex-col items-center bg-white dark:bg-gray-800 shadow-lg"
      >
        <h2 className="text-2xl font-bold capitalize mb-2">{p.details.name}</h2>
        <Image src={p.details.sprites.front_default || '/images/pokeball.png'} alt={p.details.name} width={160} height={160} className="w-40 h-40 mb-2"/>
        <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-6 mb-1">
          <motion.div 
            className={`h-6 rounded-full ${hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
            initial={{ width: '100%' }}
            animate={{ width: `${hpPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm mb-2">HP: {p.currentHp} / {p.maxHp}</p>
        {!isBattling && (
          <div className="mt-2">
            <label htmlFor={`pokemon-id-${p.details.id}`} className="mr-2">ID:</label>
            <input 
              type="text" 
              id={`pokemon-id-${p.details.id}`}
              defaultValue={currentId}
              onChange={(e) => idSetter(e.target.value)} 
              className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 w-20 text-center"
            />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-4xl font-bold text-center mb-8"
      >
        Battle Simulator
      </motion.h1>

      <div className="flex flex-col md:flex-row justify-around items-start mb-6 gap-4">
        {renderPokemon(pokemon1, setPokemon1Id, pokemon1Id)}
        <div className="text-4xl font-bold self-center p-4">VS</div>
        {renderPokemon(pokemon2, setPokemon2Id, pokemon2Id)}
      </div>

      {!isBattling && !winner && (
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={startBattle} 
          disabled={!pokemon1 || !pokemon2}
          className="block mx-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-md disabled:opacity-50"
        >
          Start Battle
        </motion.button>
      )}
      
      {isBattling && !winner && (
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleAttack} 
          className="block mx-auto bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-md"
        >
          {attacker === 1 ? pokemon1?.details.name : pokemon2?.details.name} Attacks!
        </motion.button>
      )}

      {winner && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1}} className="text-center mt-6">
          <h2 className="text-3xl font-bold text-green-500">{winner} is the Winner!</h2>
          <button 
            onClick={startBattle} // Re-start battle
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Play Again?
          </button>
        </motion.div>
      )}

      {battleLog.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow">
          <h3 className="text-xl font-semibold mb-2">Battle Log:</h3>
          <ul className="list-disc list-inside space-y-1 max-h-60 overflow-y-auto">
            {battleLog.map((log, index) => (
              <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                {log}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default BattleSimulatorPage;

