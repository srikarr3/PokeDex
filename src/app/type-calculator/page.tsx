'use client';
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import typeChartData from "@/data/typeChart.json";

// This is the type chart for DEFENSIVE interactions. 
// The provided JSON seems to be for OFFENSIVE interactions (attacker's perspective).
// We need to transform it or use a different one for defensive calculations.
// For now, let's re-interpret: 'weaknesses' in JSON means attacker is RESISTED BY these types (0.5x damage dealt)
// 'strengths' in JSON means attacker is SUPER EFFECTIVE AGAINST these types (2x damage dealt)
// 'immunes' in JSON means attacker DEALS NO DAMAGE TO these types (0x damage dealt)

// Let's define a proper defensive type chart structure or derive it.
// For simplicity in this step, we'll use the provided chart and calculate defensive matchups.

const allTypes = typeChartData.map(t => t.name.toLowerCase());

interface DefensiveMatchups {
  doubleDamageFrom: string[];
  halfDamageFrom: string[];
  noDamageFrom: string[];
}

const calculateDefensiveMatchups = (selectedTypes: string[]): DefensiveMatchups => {
  const matchups: DefensiveMatchups = {
    doubleDamageFrom: [],
    halfDamageFrom: [],
    noDamageFrom: [],
  };

  if (selectedTypes.length === 0) return matchups;

  allTypes.forEach(attackingType => {
    let multiplier = 1;
    const attackerChartEntry = typeChartData.find(t => t.name.toLowerCase() === attackingType);
    if (!attackerChartEntry) return;

    selectedTypes.forEach(defendingType => {
      if (attackerChartEntry.strengths.map(s => s.toLowerCase()).includes(defendingType)) {
        multiplier *= 2;
      }
      if (attackerChartEntry.weaknesses.map(w => w.toLowerCase()).includes(defendingType)) {
        multiplier *= 0.5;
      }
      if (attackerChartEntry.immunes.map(i => i.toLowerCase()).includes(defendingType)) {
        multiplier *= 0;
        return;
      }
    });

    if (multiplier === 0) {
      matchups.noDamageFrom.push(attackingType);
    } else if (multiplier >= 2) {
      matchups.doubleDamageFrom.push(attackingType);
    } else if (multiplier <= 0.5) {
      matchups.halfDamageFrom.push(attackingType);
    }
  });

  return matchups;
};

const TypeCalculatorPage: React.FC = () => {
  const [selectedType1, setSelectedType1] = useState<string | null>(null);
  const [selectedType2, setSelectedType2] = useState<string | null>(null);

  const handleTypeSelect = (type: string, slot: 1 | 2) => {
    if (slot === 1) {
      if (selectedType1 === type) setSelectedType1(null); // Deselect
      else if (type === selectedType2) { // Swap if selecting the other type
        setSelectedType1(type);
        setSelectedType2(selectedType1);
      } else {
        setSelectedType1(type);
      }
    } else {
      if (selectedType2 === type) setSelectedType2(null); // Deselect
      else if (type === selectedType1) { // Swap
        setSelectedType2(type);
        setSelectedType1(selectedType2);
      } else {
        setSelectedType2(type);
      }
    }
  };

  const currentSelectedTypes = useMemo(() => {
    const types = [];
    if (selectedType1) types.push(selectedType1);
    if (selectedType2 && selectedType2 !== selectedType1) types.push(selectedType2);
    return types;
  }, [selectedType1, selectedType2]);

  const defensiveMatchups = useMemo(() => calculateDefensiveMatchups(currentSelectedTypes), [currentSelectedTypes]);

  const getTypeColor = (type: string): string => {
    return `type-${type.toLowerCase()}`;
  }

  const renderTypeButton = (type: string, slot?: 1 | 2) => (
    <motion.button
      key={type}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
      onClick={() => slot && handleTypeSelect(type, slot)}
      className={`px-3 py-1.5 m-1 rounded-md text-sm font-medium text-white shadow capitalize transition-all duration-200 ease-in-out 
                 ${getTypeColor(type)} 
                 ${(slot === 1 && selectedType1 === type) || (slot === 2 && selectedType2 === type) ? 'ring-4 ring-offset-2 dark:ring-offset-gray-800 ring-yellow-400' : 'opacity-80 hover:opacity-100'}
                 ${((slot === 1 && selectedType2 === type) || (slot === 2 && selectedType1 === type)) ? '!opacity-50 cursor-not-allowed' : ''}` // Dim if selected in other slot
      }
      disabled={slot && ((slot === 1 && selectedType2 === type) || (slot === 2 && selectedType1 === type))}
    >
      {type}
    </motion.button>
  );

  const renderMatchupSection = (title: string, types: string[], bgColor: string, textColor: string = 'text-gray-800 dark:text-gray-100') => (
    <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity:1, y:0 }} className={`p-4 rounded-lg shadow ${bgColor} mb-4`}>
      <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>{title} ({types.length})</h3>
      {types.length > 0 ? (
        <div className="flex flex-wrap">
          {types.map(type => (
            <span key={type} className={`px-2.5 py-1 m-1 rounded-full text-xs font-medium text-white shadow-sm ${getTypeColor(type)}`}>
              {type}
            </span>
          ))}
        </div>
      ) : (
        <p className={`text-sm ${textColor} opacity-70`}>None</p>
      )}
    </motion.div>
  );

  return (
    <div className="container mx-auto p-4">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-center mb-8">
        Type Calculator
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map(slot => (
          <div key={slot} className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-center">Select Type {slot}</h2>
            <div className="flex flex-wrap justify-center">
              {allTypes.map(type => renderTypeButton(type, slot as 1 | 2))}
            </div>
            {slot === 1 && selectedType1 && (
              <p className="text-center mt-3 font-medium">Selected: <span className={`px-2 py-0.5 rounded text-white ${getTypeColor(selectedType1)}`}>{selectedType1}</span></p>
            )}
            {slot === 2 && selectedType2 && (
              <p className="text-center mt-3 font-medium">Selected: <span className={`px-2 py-0.5 rounded text-white ${getTypeColor(selectedType2)}`}>{selectedType2}</span></p>
            )}
          </div>
        ))}
      </div>

      {currentSelectedTypes.length > 0 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Defensive Matchups for: {currentSelectedTypes.join(' / ')}
          </h2>
          {renderMatchupSection("Takes 2x or 4x Damage From (Weaknesses)", defensiveMatchups.doubleDamageFrom, "bg-red-100 dark:bg-red-900", "text-red-800 dark:text-red-200")}
          {renderMatchupSection("Takes 0.5x or 0.25x Damage From (Resistances)", defensiveMatchups.halfDamageFrom, "bg-green-100 dark:bg-green-900", "text-green-800 dark:text-green-200")}
          {renderMatchupSection("Takes 0x Damage From (Immunities)", defensiveMatchups.noDamageFrom, "bg-gray-200 dark:bg-gray-700", "text-gray-700 dark:text-gray-300")}
        </motion.div>
      )}
       {currentSelectedTypes.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">Select one or two types to see their defensive matchups.</p>
       )}
    </div>
  );
};

export default TypeCalculatorPage;

