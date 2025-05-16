export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: { name: string; url: string }[];
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonSprites {
  front_default: string;
  other?: {
    dream_world?: {
      front_default: string | null;
    };
    home?: {
      front_default: string | null;
    };
    "official-artwork"?: {
      front_default: string | null;
    };
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonDetails {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonType[];
  sprites: PokemonSprites;
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  species: {
    url: string; // For evolution chain and description
  };
}

export interface PokemonSpecies {
  name: string;
  evolution_chain: {
    url: string;
  };
  flavor_text_entries: {
    flavor_text: string;
    language: {
      name: string;
      url: string;
    };
    version: {
      name: string;
      url: string;
    };
  }[];
  pokedex_numbers: {
    entry_number: number;
    pokedex: {
      name: string;
      url: string;
    };
  }[];
  egg_groups: { name: string; url: string }[];
}

export interface EvolutionChain {
  id: number;
  chain: EvolutionLink;
}

export interface EvolutionLink {
  species: {
    name: string;
    url: string;
  };
  evolves_to: EvolutionLink[];
  is_baby: boolean;
}

const API_BASE_URL = "https://pokeapi.co/api/v2";

export async function fetchPokemonList(limit: number = 20, offset: number = 0): Promise<PokemonListResponse> {
  const response = await fetch(`${API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    throw new Error("Failed to fetch Pokémon list");
  }
  return response.json();
}

export async function fetchPokemonDetails(nameOrId: string | number): Promise<PokemonDetails> {
  const response = await fetch(`${API_BASE_URL}/pokemon/${nameOrId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon details for ${nameOrId}`);
  }
  return response.json();
}

export async function fetchPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
  const response = await fetch(`${API_BASE_URL}/pokemon-species/${nameOrId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon species data for ${nameOrId}`);
  }
  return response.json();
}

export async function fetchEvolutionChain(url: string): Promise<EvolutionChain> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch evolution chain from ${url}`);
  }
  return response.json();
}

// Helper to get a specific Pokémon's ID from its URL
export const getPokemonIdFromUrl = (url: string): string => {
  const parts = url.split("/");
  return parts[parts.length - 2];
};

