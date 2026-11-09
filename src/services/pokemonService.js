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

const SPACE_POKEMONS = [
  'deoxys',
  'rayquaza',
  'jirachi',
  'solgaleo',
  'lunala',
  'necrozma',
  'eternatus',
  'palkia',
  'dialga',
  'giratina',
  'arceus',
  'cosmog',
  'cosmoem',
  'minior',
  'elgyem',
  'beheeyem',
];

const resolveHabitat = (rawHabitat, isMythical, isLegendary, primaryType, pokemonName) => {
  // 1. Si la PokéAPI provee hábitat válido
  if (rawHabitat && rawHabitat !== 'unknown') {
    return rawHabitat;
  }

  const name = String(pokemonName || '').toLowerCase();

  // 2. Criaturas espaciales / interdimensionales
  if (SPACE_POKEMONS.includes(name)) {
    return 'space';
  }

  // 3. Míticos
  if (isMythical) {
    return 'mythical';
  }

  // 4. Legendarios
  if (isLegendary) {
    return 'legendary';
  }

  // 5. Inferencia por tipo elemental primario
  switch (primaryType?.toLowerCase()) {
    case 'water':
      return 'sea';
    case 'grass':
      return 'grassland';
    case 'bug':
      return 'forest';
    case 'fire':
    case 'ice':
    case 'rock':
      return 'mountain';
    case 'ground':
    case 'dark':
      return 'rough-terrain';
    case 'electric':
    case 'steel':
      return 'urban';
    case 'poison':
      return 'swamp';
    case 'ghost':
      return 'spooky';
    case 'psychic':
    case 'dragon':
    case 'fairy':
      return 'rare';
    case 'flying':
    case 'normal':
      return 'grassland';
    default:
      return 'rare';
  }
};

const parseEvolutionDetails = (details, lang = 'es') => {
  if (!details || details.length === 0) return null;
  const d = details[0];

  // 1. Por Nivel
  if (d.min_level) {
    return lang === 'es' ? `Nv. ${d.min_level}` : `Lv. ${d.min_level}`;
  }

  // 2. Por Objeto / Piedra evolutiva
  if (d.item) {
    const stoneNames = {
      'thunder-stone': lang === 'es' ? 'Piedra Trueno' : 'Thunder Stone',
      'fire-stone': lang === 'es' ? 'Piedra Fuego' : 'Fire Stone',
      'water-stone': lang === 'es' ? 'Piedra Agua' : 'Water Stone',
      'leaf-stone': lang === 'es' ? 'Piedra Hoja' : 'Leaf Stone',
      'moon-stone': lang === 'es' ? 'Piedra Lunar' : 'Moon Stone',
      'sun-stone': lang === 'es' ? 'Piedra Solar' : 'Sun Stone',
      'shiny-stone': lang === 'es' ? 'Piedra Día' : 'Shiny Stone',
      'dusk-stone': lang === 'es' ? 'Piedra Noche' : 'Dusk Stone',
      'dawn-stone': lang === 'es' ? 'Piedra Alba' : 'Dawn Stone',
      'ice-stone': lang === 'es' ? 'Piedra Hielo' : 'Ice Stone',
    };
    return stoneNames[d.item.name] || d.item.name.replace(/-/g, ' ');
  }

  // 3. Por Amistad / Felicidad
  if (d.min_happiness) {
    return lang === 'es' ? 'Amistad' : 'Friendship';
  }

  // 4. Por Intercambio
  if (d.trigger?.name === 'trade') {
    if (d.held_item) {
      return lang === 'es'
        ? `Intercambio c/ ${d.held_item.name.replace(/-/g, ' ')}`
        : `Trade w/ ${d.held_item.name.replace(/-/g, ' ')}`;
    }
    return lang === 'es' ? 'Intercambio' : 'Trade';
  }

  // 5. Por Movimiento aprendido
  if (d.known_move) {
    return lang === 'es'
      ? `Con ${d.known_move.name.replace(/-/g, ' ')}`
      : `With ${d.known_move.name.replace(/-/g, ' ')}`;
  }

  return lang === 'es' ? 'Especial' : 'Special';
};

const parseEvolutionChain = (chainNode, targetName = '', lang = 'es') => {
  const chain = [];
  let current = chainNode;

  while (current && current.species) {
    const speciesName = current.species.name;
    const urlParts = current.species.url ? current.species.url.split('/').filter(Boolean) : [];
    const id = parseInt(urlParts[urlParts.length - 1], 10);

    // Requisito para evolucionar a ESTE Pokémon
    const requirement = parseEvolutionDetails(current.evolution_details, lang);

    chain.push({
      name: speciesName,
      id,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      requirement,
      trigger: requirement,
    });

    if (current.evolves_to && current.evolves_to.length > 0) {
      if (current.evolves_to.length === 1) {
        current = current.evolves_to[0];
      } else {
        const targetBranch = current.evolves_to.find((branch) => {
          let b = branch;
          while (b) {
            if (b.species?.name?.toLowerCase() === String(targetName).toLowerCase()) return true;
            b = b.evolves_to?.[0];
          }
          return false;
        });
        current = targetBranch || current.evolves_to[0];
      }
    } else {
      current = null;
    }
  }

  return chain;
};

/**
 * Obtiene la información de la especie (lore/descripción de la Pokédex y categoría/género) en el idioma seleccionado.
 * @param {string|number} pokemonIdOrName - ID o nombre del Pokémon
 * @param {string} lang - Código de idioma ('es' o 'en')
 * @param {string|null} primaryType - Tipo elemental primario opcional para inferencia de hábitat
 * @returns {Promise<{ description: string, genus: string, varieties: Array, habitat: string, evolutionChain: Array }>}
 */
export const getPokemonSpeciesData = async (pokemonIdOrName, lang = 'es', primaryType = null) => {
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

    // 3. Extraer variedades (formas alternativas, mega, gmax, etc.)
    const varieties = Array.isArray(data.varieties)
      ? data.varieties.map((v) => ({
          name: v.pokemon.name,
          url: v.pokemon.url,
          is_default: v.is_default,
        }))
      : [];

    // 4. Extraer y resolver hábitat
    const rawHabitat = data.habitat ? data.habitat.name : null;
    const isMythical = Boolean(data.is_mythical);
    const isLegendary = Boolean(data.is_legendary);
    const habitat = resolveHabitat(
      rawHabitat,
      isMythical,
      isLegendary,
      primaryType,
      data.name || cleanIdentifier
    );

    // 5. Extraer y procesar cadena evolutiva
    let evolutionChain = [];
    const evolutionChainUrl = data.evolution_chain?.url;
    if (evolutionChainUrl) {
      try {
        const evoResponse = await axios.get(evolutionChainUrl);
        if (evoResponse.data?.chain) {
          evolutionChain = parseEvolutionChain(evoResponse.data.chain, cleanIdentifier, lang);
        }
      } catch (evoErr) {
        console.warn('Error al obtener la cadena de evolución:', evoErr);
      }
    }

    return {
      description,
      genus,
      varieties,
      habitat,
      evolutionChain,
      isLegendary,
      isMythical,
    };
  } catch (error) {
    console.error(`Error al obtener especie/lore de "${pokemonIdOrName}":`, error);
    return {
      description:
        lang === 'es'
          ? 'Información de la Pokédex no disponible actualmente.'
          : 'Pokédex information currently unavailable.',
      genus: lang === 'es' ? 'Pokémon Desconocido' : 'Unknown Pokémon',
      varieties: [],
      habitat: resolveHabitat(null, false, false, primaryType, pokemonIdOrName),
      evolutionChain: [],
      isLegendary: false,
      isMythical: false,
    };
  }
};

const formsCache = {};

/**
 * Consulta el endpoint de la PokéAPI para obtener los datos completos de una forma específica.
 * @param {string} pokemonNameOrUrl - URL completa (ej. "https://pokeapi.co/api/v2/pokemon/10033/") o nombre de la forma
 * @returns {Promise<object>} Objeto completo del Pokémon para esa forma específica
 */
export const getPokemonFormData = async (pokemonNameOrUrl) => {
  const key = String(pokemonNameOrUrl).trim();
  if (formsCache[key]) return formsCache[key];

  try {
    const url = key.startsWith('http')
      ? key
      : `${BASE_URL}/pokemon/${key.toLowerCase()}`;

    const response = await axios.get(url);
    formsCache[key] = response.data;
    return response.data;
  } catch (error) {
    throw new Error(`Error al obtener datos de la forma "${pokemonNameOrUrl}": ${error.message}`, {
      cause: error,
    });
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

/**
 * Convierte el nombre de PokéAPI al formato de archivo de Showdown
 * Ej: 'tapu-koko' -> 'tapukoko', 'mr-mime' -> 'mrmime', 'charizard-mega-x' -> 'charizard-megax', 'venusaur-gmax' -> 'venusaur-gmax'
 */
export const getShowdownSlug = (pokemonName) => {
  if (!pokemonName) return '';
  let slug = pokemonName.toLowerCase().trim();

  // Excepciones y reemplazos comunes de formato en Showdown:
  slug = slug
    .replace(/[\s.':]/g, '')
    .replace(/-normal$/, '')
    .replace(/-standard$/, '')
    .replace(/-incarnate$/, '')
    .replace(/-altered$/, '')
    .replace(/-average$/, '')
    .replace(/-shield$/, '')
    .replace(/-50$/, '')
    .replace(/-disguised$/, '');

  return slug;
};

/**
 * Resuelve la ilustración oficial en alta resolución / 3D Home de PokéAPI
 */
export const getHighResArtwork = (pokemon, isShiny = false) => {
  if (!pokemon) return '';
  if (isShiny) {
    return (
      pokemon.sprites?.other?.['official-artwork']?.front_shiny ||
      pokemon.sprites?.other?.home?.front_shiny ||
      pokemon.sprites?.front_shiny ||
      ''
    );
  }
  return (
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.other?.home?.front_default ||
    pokemon.sprites?.front_default ||
    ''
  );
};

export const getModernAnimatedSprite = getHighResArtwork;
export const getAnimatedSpriteUrl = getHighResArtwork;

const moveCache = new Map();

/**
 * Obtiene el nombre localizado oficial de un movimiento desde PokéAPI (/move/{id_o_nombre})
 */
export const getTranslatedMoveName = async (moveName, lang = 'es') => {
  if (!moveName) return '';

  const clean = String(moveName).toLowerCase().trim();
  const cacheKey = `${clean}-${lang}`;
  if (moveCache.has(cacheKey)) {
    return moveCache.get(cacheKey);
  }

  try {
    const response = await axios.get(`${BASE_URL}/move/${clean}`);
    const data = response.data;

    // Buscar traducción oficial en el idioma solicitado:
    const localized = data.names?.find((n) => n.language?.name === lang);
    const enName = data.names?.find((n) => n.language?.name === 'en');
    const resolvedName = localized ? localized.name : (enName ? enName.name : clean.replace(/-/g, ' '));

    moveCache.set(cacheKey, resolvedName);
    return resolvedName;
  } catch {
    // Fallback elegante capitalizado en caso de error o límite de red:
    const fallback = clean.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return fallback;
  }
};

/**
 * Traduce una lista de movimientos por lotes (ej. los primeros 25-45 visibles)
 */
export const translateMovesBatch = async (moveList, lang = 'es') => {
  if (!Array.isArray(moveList)) return [];
  const promises = moveList.map(async (m) => {
    const rawName = typeof m === 'string' ? m : m.move?.name || m.name;
    const translated = await getTranslatedMoveName(rawName, lang);
    return {
      rawName,
      displayName: translated,
      learnMethod: m.version_group_details?.[0]?.move_learn_method?.name,
      levelLearnedAt: m.version_group_details?.[0]?.level_learned_at ?? 0,
    };
  });
  return Promise.all(promises);
};

/**
 * Categoriza y traduce los movimientos del Pokémon por método (nivel, MT/MO, huevo, tutor)
 */
export const categorizeAndTranslateMoves = async (movesArray, lang = 'es') => {
  if (!movesArray || movesArray.length === 0) return { levelUp: [], machine: [], egg: [], tutor: [] };

  // Mapear cada movimiento con su método más reciente
  const parsedMoves = movesArray.map((m) => {
    // Tomar el último grupo de versión disponible (la versión más moderna en la que aprende el ataque)
    const latestVersion = m.version_group_details && m.version_group_details.length > 0
      ? m.version_group_details[m.version_group_details.length - 1]
      : null;
    return {
      rawName: m.move.name,
      method: latestVersion?.move_learn_method?.name || 'level-up',
      level: latestVersion?.level_learned_at || 0
    };
  });

  // Clasificar en grupos
  const levelUpMoves = parsedMoves.filter(m => m.method === 'level-up').sort((a, b) => a.level - b.level);
  const machineMoves = parsedMoves.filter(m => m.method === 'machine');
  const eggMoves = parsedMoves.filter(m => m.method === 'egg');
  const tutorMoves = parsedMoves.filter(m => m.method === 'tutor');

  // Función interna para traducir un subconjunto
  const resolveGroup = async (group) => {
    return Promise.all(
      group.map(async (item) => ({
        ...item,
        displayName: await getTranslatedMoveName(item.rawName, lang)
      }))
    );
  };

  const [levelUp, machine, egg, tutor] = await Promise.all([
    resolveGroup(levelUpMoves),
    resolveGroup(machineMoves),
    resolveGroup(eggMoves),
    resolveGroup(tutorMoves)
  ]);

  return { levelUp, machine, egg, tutor };
};
