import axios from 'axios';

const BASE_URL = import.meta.env?.VITE_POKEAPI_URL || 'https://pokeapi.co/api/v2';

export const getPokemonList = async (limit = 12, offset = 0) => {
  try {
    const response = await axios.get(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    return {
      results: response.data.results,
      count: response.data.count
    };
  } catch (error) {
    throw new Error('Error al obtener el catálogo: ' + error.message, { cause: error });
  }
};

export const getPokemonDetails = async (nameOrId) => {
  try {
    const cleanId = String(nameOrId).trim().toLowerCase();
    const response = await axios.get(`${BASE_URL}/pokemon/${cleanId}`);
    return response.data;
  } catch (error) {
    throw new Error(`No se pudo obtener la información de "${nameOrId}"`, { cause: error });
  }
};

/**
 * Obtiene la información de la especie (lore/descripción de la Pokédex y categoría/género) en el idioma seleccionado.
 * @param {string|number} pokemonIdOrName - ID o nombre del Pokémon
 * @param {string} lang - Código de idioma ('es' o 'en')
 * @returns {Promise<{ description: string, genus: string }>}
 */
export const getPokemonSpeciesData = async (pokemonIdOrName, lang = 'es') => {
  try {
    const cleanIdentifier = String(pokemonIdOrName).trim().toLowerCase();
    const response = await axios.get(`${BASE_URL}/pokemon-species/${cleanIdentifier}`);
    const data = response.data || {};

    // 1. Obtener flavor_text en el idioma seleccionado, o fallback a inglés ('en')
    const flavorEntries = data.flavor_text_entries || [];
    const flavorEntry =
      flavorEntries.find((entry) => entry.language?.name === lang) ||
      flavorEntries.find((entry) => entry.language?.name === 'en');

    const defaultMsg =
      lang === 'es'
        ? 'Información de la Pokédex no disponible actualmente.'
        : 'Pokédex information currently unavailable.';

    const rawDescription = flavorEntry?.flavor_text || defaultMsg;
    // Limpiar saltos de línea molestos o caracteres extraños (\f, \n, \r)
    const description = rawDescription.replace(/[\f\n\r]/g, ' ').replace(/\s+/g, ' ').trim();

    // 2. Obtener genus localizado (categoría, ej. "Pokémon Semilla" o "Seed Pokémon")
    const genera = data.genera || [];
    const genusEntry =
      genera.find((g) => g.language?.name === lang) ||
      genera.find((g) => g.language?.name === 'en');

    const genus = genusEntry?.genus || (lang === 'es' ? 'Pokémon' : 'Pokémon');

    return {
      description,
      genus,
    };
  } catch (error) {
    console.error(`Error al obtener especie/lore de "${pokemonIdOrName}":`, error);
    return {
      description:
        lang === 'es'
          ? 'Información de la Pokédex no disponible actualmente.'
          : 'Pokédex information currently unavailable.',
      genus: lang === 'es' ? 'Pokémon Desconocido' : 'Unknown Pokémon',
    };
  }
};

let allPokemonCache = null;

export const getAllPokemonNames = async () => {
  if (allPokemonCache) return allPokemonCache;
  try {
    const response = await axios.get(`${BASE_URL}/pokemon?limit=1025&offset=0`);
    allPokemonCache = response.data.results; // Array de { name, url }
    return allPokemonCache;
  } catch (error) {
    console.error('Error cargando catálogo global:', error);
    return [];
  }
};

/**
 * Obtiene y calcula las relaciones de tipo (debilidades y fortalezas defensivas/ofensivas).
 * @param {Array<string|object>} types - Lista de tipos (ej. ['grass', 'poison'] o [{ type: { name: 'grass' } }])
 * @returns {Promise<{ strongAgainst: string[], weakAgainst: string[], notEffectiveAgainst: string[] }>}
 */
export const getPokemonTypeRelations = async (types) => {
  try {
    if (!types || !Array.isArray(types) || types.length === 0) {
      return { strongAgainst: [], weakAgainst: [], notEffectiveAgainst: [] };
    }

    // Normalizar nombres de tipos
    const typeNames = types
      .map((t) => (typeof t === 'string' ? t : t?.type?.name || t?.name))
      .filter(Boolean)
      .map((name) => name.toLowerCase());

    if (typeNames.length === 0) {
      return { strongAgainst: [], weakAgainst: [], notEffectiveAgainst: [] };
    }

    // Peticiones paralelas por cada tipo
    const typeResponses = await Promise.all(
      typeNames.map((typeName) => axios.get(`${BASE_URL}/type/${typeName}`))
    );

    // 1. Supereficaz contra (Ofensivo): Agrupa double_damage_to evitando duplicados
    const strongAgainstSet = new Set();
    // 2. Ineficaz / Poco eficaz contra (Ofensivo): Agrupa half_damage_to y no_damage_to
    const notEffectiveAgainstSet = new Set();

    typeResponses.forEach((response) => {
      const damageRelations = response.data?.damage_relations || {};
      const doubleDamageTo = damageRelations.double_damage_to || [];
      const halfDamageTo = damageRelations.half_damage_to || [];
      const noDamageTo = damageRelations.no_damage_to || [];

      doubleDamageTo.forEach((relation) => {
        strongAgainstSet.add(relation.name);
      });

      halfDamageTo.forEach((relation) => {
        notEffectiveAgainstSet.add(relation.name);
      });

      noDamageTo.forEach((relation) => {
        notEffectiveAgainstSet.add(relation.name);
      });
    });

    // 3. Débil contra (Defensivo): Multiplicador neto considerando tipos duales
    const defensiveMultipliers = {};

    typeResponses.forEach((response) => {
      const damageRelations = response.data?.damage_relations || {};
      const {
        double_damage_from = [],
        half_damage_from = [],
        no_damage_from = []
      } = damageRelations;

      double_damage_from.forEach(({ name }) => {
        defensiveMultipliers[name] = (defensiveMultipliers[name] ?? 1) * 2;
      });

      half_damage_from.forEach(({ name }) => {
        defensiveMultipliers[name] = (defensiveMultipliers[name] ?? 1) * 0.5;
      });

      no_damage_from.forEach(({ name }) => {
        defensiveMultipliers[name] = (defensiveMultipliers[name] ?? 1) * 0;
      });
    });

    // Solo se consideran débiles aquellos tipos con daño neto superior a x1
    const weakAgainst = Object.entries(defensiveMultipliers)
      .filter(([, multiplier]) => multiplier > 1)
      .map(([typeName]) => typeName);

    return {
      strongAgainst: Array.from(strongAgainstSet),
      weakAgainst,
      notEffectiveAgainst: Array.from(notEffectiveAgainstSet)
    };
  } catch (error) {
    throw new Error('Error al calcular las relaciones de tipo: ' + error.message, { cause: error });
  }
};

/**
 * Obtiene la línea evolutiva completa ordenada (pre-evolución y evoluciones).
 * @param {string|number} pokemonIdOrName - ID o nombre del Pokémon
 * @returns {Promise<string[]>} Array lineal con los nombres de la línea evolutiva
 */
export const getPokemonEvolutions = async (pokemonIdOrName) => {
  try {
    const cleanIdentifier = String(pokemonIdOrName).trim().toLowerCase();
    
    // 1. Consultar species para obtener la URL de evolution_chain
    const speciesResponse = await axios.get(`${BASE_URL}/pokemon-species/${cleanIdentifier}`);
    const evolutionChainUrl = speciesResponse.data?.evolution_chain?.url;

    if (!evolutionChainUrl) {
      return [cleanIdentifier];
    }

    // 2. Consultar la cadena evolutiva
    const evolutionResponse = await axios.get(evolutionChainUrl);
    const chainRoot = evolutionResponse.data?.chain;

    // 3. Recorrer recursivamente el árbol de evolución
    const evolutions = [];

    const traverseChain = (node) => {
      if (!node || !node.species) return;

      const speciesName = node.species.name;
      if (speciesName && !evolutions.includes(speciesName)) {
        evolutions.push(speciesName);
      }

      if (Array.isArray(node.evolves_to)) {
        node.evolves_to.forEach(traverseChain);
      }
    };

    traverseChain(chainRoot);

    return evolutions;
  } catch (error) {
    throw new Error(`Error al obtener la cadena evolutiva de "${pokemonIdOrName}": ${error.message}`, {
      cause: error
    });
  }
};

const abilitiesCache = {};

export const getAbilityName = async (abilityUrlOrName, lang = 'es') => {
  const key = `${abilityUrlOrName}_${lang}`;
  if (abilitiesCache[key]) return abilitiesCache[key];

  try {
    const url = String(abilityUrlOrName).startsWith('http')
      ? abilityUrlOrName
      : `${BASE_URL}/ability/${abilityUrlOrName}`;

    const response = await axios.get(url);
    const nameEntry = response.data.names?.find(
      (n) => n.language?.name === lang
    );

    // Si encuentra el nombre en el idioma elegido lo guarda, sino usa el fallback en inglés o el slug nativo
    const localizedName = nameEntry ? nameEntry.name : response.data.name;
    abilitiesCache[key] = localizedName;
    return localizedName;
  } catch (error) {
    console.error('Error al traducir habilidad:', error);
    return typeof abilityUrlOrName === 'string' && !abilityUrlOrName.startsWith('http')
      ? abilityUrlOrName
      : 'Habilidad';
  }
};

/**
 * Categoriza la lista de movimientos de un Pokémon a partir de version_group_details.
 * @param {Array} movesList - Array pokemon.moves devuelto por la PokéAPI
 * @returns {{ levelUp: Array<{ name: string, level: number }>, machine: Array<{ name: string }>, egg: Array<{ name: string }> }}
 */
export const getPokemonMovesCategorized = (movesList) => {
  const result = {
    levelUp: [],
    machine: [],
    egg: [],
  };

  if (!Array.isArray(movesList)) return result;

  movesList.forEach((item) => {
    if (!item || !item.move || !Array.isArray(item.version_group_details) || item.version_group_details.length === 0) {
      return;
    }

    // Última versión disponible
    const latestDetail = item.version_group_details[item.version_group_details.length - 1];
    const method = latestDetail?.move_learn_method?.name;
    const moveName = item.move.name;

    if (method === 'level-up') {
      result.levelUp.push({
        name: moveName,
        level: latestDetail.level_learned_at ?? 0,
      });
    } else if (method === 'machine') {
      result.machine.push({
        name: moveName,
      });
    } else if (method === 'egg') {
      result.egg.push({
        name: moveName,
      });
    }
  });

  // Ordenar movimientos por nivel de menor a mayor
  result.levelUp.sort((a, b) => a.level - b.level);

  return result;
};
