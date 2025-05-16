'use client';
import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <motion.div
        className="relative w-24 h-24"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Pokéball top */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full border-4 border-gray-800" />
        
        {/* Pokéball bottom */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white rounded-b-full border-4 border-gray-800" />
        
        {/* Center line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 transform -translate-y-1/2" />
        
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white rounded-full border-4 border-gray-800 transform -translate-x-1/2 -translate-y-1/2" />
        
        {/* Inner circle */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      <motion.p 
        className="mt-4 text-xl font-bold text-gray-800"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Loading...
      </motion.p>
    </div>
  );
};

export default LoadingSpinner; 