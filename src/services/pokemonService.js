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
 * Obtiene la información básica de la especie para un Pokémon o ID sin fallar en nombres con sufijo
 * @param {object|string|number} pokemonOrId
 * @returns {Promise<object|null>}
 */
export const getPokemonSpecies = async (pokemonOrId) => {
  try {
    let url;
    if (typeof pokemonOrId === 'object' && pokemonOrId !== null) {
      if (pokemonOrId.species?.url) {
        url = pokemonOrId.species.url;
      } else if (pokemonOrId.id && pokemonOrId.id <= 1025) {
        url = `${BASE_URL}/pokemon-species/${pokemonOrId.id}`;
      } else {
        const cleanKey = String(pokemonOrId.id || pokemonOrId.name || '').split('-')[0].toLowerCase().trim();
        url = `${BASE_URL}/pokemon-species/${cleanKey}`;
      }
    } else {
      const idOrName = String(pokemonOrId).trim().toLowerCase();
      const cleanKey = idOrName.split('-')[0];
      url = `${BASE_URL}/pokemon-species/${cleanKey}`;
    }
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error('Error fetching species:', err);
    return null;
  }
};

/**
 * Obtiene la información de la especie (lore/descripción de la Pokédex y categoría/género) en el idioma seleccionado.
 * @param {string|number|object} pokemonIdOrName - Objeto Pokémon, ID o nombre
 * @param {string} lang - Código de idioma ('es' o 'en')
 * @param {string|null} primaryType - Tipo elemental primario opcional para inferencia de hábitat
 * @returns {Promise<{ description: string, genus: string, varieties: Array, habitat: string, evolutionChain: Array, isLegendary: boolean, isMythical: boolean }>}
 */
export const getPokemonSpeciesData = async (pokemonIdOrName, lang = 'es', primaryType = null) => {
  try {
    let url;
    let identifierForFallback = '';
    if (typeof pokemonIdOrName === 'object' && pokemonIdOrName !== null) {
      identifierForFallback = pokemonIdOrName.name || '';
      if (pokemonIdOrName.species?.url) {
        url = pokemonIdOrName.species.url;
      } else if (pokemonIdOrName.id && pokemonIdOrName.id <= 1025) {
        url = `${BASE_URL}/pokemon-species/${pokemonIdOrName.id}`;
      } else {
        const cleanKey = String(pokemonIdOrName.id || pokemonIdOrName.name || '').split('-')[0].toLowerCase().trim();
        url = `${BASE_URL}/pokemon-species/${cleanKey}`;
      }
    } else {
      identifierForFallback = String(pokemonIdOrName).trim().toLowerCase();
      const cleanKey = identifierForFallback.split('-')[0];
      url = `${BASE_URL}/pokemon-species/${cleanKey}`;
    }

    const response = await axios.get(url);
    const data = response.data || {};
    const speciesName = data.name || identifierForFallback;

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
        name: v.pokemon ? v.pokemon.name : v.name,
        url: v.pokemon ? v.pokemon.url : v.url,
        is_default: v.is_default ?? v.isDefault ?? false,
      }))
      : [];

    // 4. Extraer y resolver hábitat
    const rawHabitat = data.habitat ? data.habitat.name : null;
    const isMythical = Boolean(data.is_mythical);
    const isLegendary = Boolean(data.is_legendary);
    const hasGenderDifferences = Boolean(data.has_gender_differences);
    const habitat = resolveHabitat(
      rawHabitat,
      isMythical,
      isLegendary,
      primaryType,
      speciesName
    );

    // 5. Extraer y procesar cadena evolutiva
    let evolutionChain = [];
    const evolutionChainUrl = data.evolution_chain?.url;
    if (evolutionChainUrl) {
      try {
        const evoResponse = await axios.get(evolutionChainUrl);
        if (evoResponse.data?.chain) {
          evolutionChain = parseEvolutionChain(evoResponse.data.chain, speciesName, lang);
        }
      } catch (evoErr) {
        console.warn('Error al obtener la cadena de evolución:', evoErr);
      }
    }

    return {
      name: speciesName,
      description,
      genus,
      varieties,
      habitat,
      evolutionChain,
      isLegendary,
      isMythical,
      has_gender_differences: hasGenderDifferences,
    };
  } catch (error) {
    console.error(`Error al obtener especie/lore de "${pokemonIdOrName}":`, error);
    const rawName = typeof pokemonIdOrName === 'object' ? (pokemonIdOrName.name || '') : String(pokemonIdOrName);
    return {
      name: rawName.trim().toLowerCase(),
      description:
        lang === 'es'
          ? 'Información de la Pokédex no disponible actualmente.'
          : 'Pokédex information currently unavailable.',
      genus: lang === 'es' ? 'Pokémon Desconocido' : 'Unknown Pokémon',
      varieties: [],
      habitat: resolveHabitat(null, false, false, primaryType, rawName),
      evolutionChain: [],
      isLegendary: false,
      isMythical: false,
      has_gender_differences: false,
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

/**
 * Diccionario de traducción y limpieza de nombres de formas especiales (ES / EN)
 */
export const FORM_LABELS = {
  es: {
    'mega': 'Mega',
    'mega-x': 'Mega X',
    'mega-y': 'Mega Y',
    'gmax': 'Gigamax',
    'alola': 'Alola',
    'galar': 'Galar',
    'hisui': 'Hisui',
    'paldea': 'Paldea',
    'disguised': 'Disfrazado',
    'busted': 'Descubierto',
    'ice': 'Cara Hielo',
    'noice': 'Cara Deshielo',
    'full-belly': 'Saciado',
    'hangry': 'Voraz',
    'meteor': 'Meteorito',
    'red-meteor': 'Meteorito',
    'orange-meteor': 'Meteorito Naranja',
    'yellow-meteor': 'Meteorito Amarillo',
    'green-meteor': 'Meteorito Verde',
    'blue-meteor': 'Meteorito Azul',
    'indigo-meteor': 'Meteorito Añil',
    'violet-meteor': 'Meteorito Violeta',
    'red': 'Núcleo Rojo',
    'orange': 'Núcleo Naranja',
    'yellow': 'Núcleo Amarillo',
    'green': 'Núcleo Verde',
    'blue': 'Núcleo Azul',
    'indigo': 'Núcleo Añil',
    'violet': 'Núcleo Violeta',
    'spiky-eared': 'Picoreja',
    'blade': 'Filo',
    'shield': 'Escudo',
    'solo': 'Individual',
    'school': 'Banco',
    'sunshine': 'Soleado',
    'overcast': 'Encapotado',
    'sunny': 'Sol',
    'rainy': 'Lluvia',
    'snowy': 'Nieve',
    'therian': 'Totémica',
    'incarnate': 'Avatar',
    'origin': 'Origen',
    'altered': 'Modificada',
    'sky': 'Cielo',
    'land': 'Tierra',
    'zen': 'Daruma',
    'standard': 'Estándar',
    'pirouette': 'Lírica',
    'aria': 'Lírica',
    'ash': 'Ash',
    'crowned': 'Forma Suprema',
    'crowned-sword': 'Espada Suprema',
    'crowned-shield': 'Escudo Supremo',
    'eternamax': 'Eternamax',
    'bloodmoon': 'Luna Carmesí',
    'totem': 'Tótem',
    'totem-disguised': 'Tótem Disfrazado',
    'totem-busted': 'Tótem Descubierto',
    'totem-alola': 'Tótem Alola',
    'starter': 'Compañero',
    'dusk': 'Melena Crepuscular',
    'dawn': 'Alas del Alba',
    'ultra': 'Ultra',
    'shadow': 'Jinete Espectral',
    'black': 'Kyurem Negro',
    'white': 'Kyurem Blanco',
    '10': 'Forma 10%',
    '50': 'Forma 50%',
    'complete': 'Forma Completa',
    'rapid-strike': 'Estilo Fluido',
    'single-strike': 'Estilo Brusco',
    'wellspring-mask': 'Máscara Fuente',
    'hearthflame-mask': 'Máscara Horno',
    'cornerstone-mask': 'Máscara Cimiento',
    'terastal': 'Teracristal',
    'stellar': 'Astral',
    'paldea-combat-breed': 'Paldea Combativa',
    'paldea-blaze-breed': 'Paldea Ardiente',
    'paldea-aqua-breed': 'Paldea Acuática',
    'low-key': 'Forma Grave',
    'amped': 'Forma Aguda',
    'baile': 'Apasionado',
    'pom-pom': 'Animado',
    'pau': 'Plácido',
    'sensu': 'Refinado',
    'midnight': 'Noche',
    'midday': 'Día',
    'dusk-form': 'Crepúsculo',
    'hero': 'Héroe',
    'zero': 'Ingenua',
    'stretchy': 'Elástica',
    'droopy': 'Lánguida',
    'curly': 'Curvada',
    'three-segment': 'Tres Segmentos',
    'family-of-three': 'Familia de Tres',
    'family-of-four': 'Familia de Cuatro',
    'male': '♂ Macho',
    'female': '♀ Hembra',
    'roaming': 'Andante',
    'chest': 'Cofre',
  },
  en: {
    'mega': 'Mega',
    'mega-x': 'Mega X',
    'mega-y': 'Mega Y',
    'gmax': 'Gigantamax',
    'alola': 'Alolan',
    'galar': 'Galarian',
    'hisui': 'Hisuian',
    'paldea': 'Paldean',
    'disguised': 'Disguised',
    'busted': 'Busted',
    'ice': 'Ice Face',
    'noice': 'Noice Face',
    'full-belly': 'Full Belly',
    'hangry': 'Hangry',
    'meteor': 'Meteor',
    'red-meteor': 'Red Meteor',
    'orange-meteor': 'Orange Meteor',
    'yellow-meteor': 'Yellow Meteor',
    'green-meteor': 'Green Meteor',
    'blue-meteor': 'Blue Meteor',
    'indigo-meteor': 'Indigo Meteor',
    'violet-meteor': 'Violet Meteor',
    'red': 'Red Core',
    'orange': 'Orange Core',
    'yellow': 'Yellow Core',
    'green': 'Green Core',
    'blue': 'Blue Core',
    'indigo': 'Indigo Core',
    'violet': 'Violet Core',
    'spiky-eared': 'Spiky-eared',
    'blade': 'Blade',
    'shield': 'Shield',
    'solo': 'Solo',
    'school': 'School',
    'sunshine': 'Sunshine',
    'overcast': 'Overcast',
    'sunny': 'Sunny',
    'rainy': 'Rainy',
    'snowy': 'Snowy',
    'therian': 'Therian',
    'incarnate': 'Incarnate',
    'origin': 'Origin',
    'altered': 'Altered',
    'sky': 'Sky',
    'land': 'Land',
    'zen': 'Zen',
    'standard': 'Standard',
    'pirouette': 'Pirouette',
    'aria': 'Aria',
    'ash': 'Ash',
    'crowned': 'Crowned',
    'crowned-sword': 'Crowned Sword',
    'crowned-shield': 'Crowned Shield',
    'eternamax': 'Eternamax',
    'bloodmoon': 'Bloodmoon',
    'totem': 'Totem',
    'totem-disguised': 'Totem Disguised',
    'totem-busted': 'Totem Busted',
    'totem-alola': 'Totem Alola',
    'starter': 'Starter',
    'dusk': 'Dusk Mane',
    'dawn': 'Dawn Wings',
    'ultra': 'Ultra',
    'shadow': 'Shadow Rider',
    'black': 'Black Kyurem',
    'white': 'White Kyurem',
    '10': '10% Forme',
    '50': '50% Forme',
    'complete': 'Complete Forme',
    'rapid-strike': 'Rapid Strike',
    'single-strike': 'Single Strike',
    'wellspring-mask': 'Wellspring Mask',
    'hearthflame-mask': 'Hearthflame Mask',
    'cornerstone-mask': 'Cornerstone Mask',
    'terastal': 'Terastal',
    'stellar': 'Stellar',
    'paldea-combat-breed': 'Paldean Combat Breed',
    'paldea-blaze-breed': 'Paldean Blaze Breed',
    'paldea-aqua-breed': 'Paldean Aqua Breed',
    'low-key': 'Low Key',
    'amped': 'Amped',
    'baile': 'Baile',
    'pom-pom': 'Pom-Pom',
    'pau': 'Pa\'u',
    'sensu': 'Sensu',
    'midnight': 'Midnight',
    'midday': 'Midday',
    'dusk-form': 'Dusk Form',
    'hero': 'Hero Form',
    'zero': 'Zero Form',
    'stretchy': 'Stretchy',
    'droopy': 'Droopy',
    'curly': 'Curly',
    'three-segment': 'Three-Segment',
    'family-of-three': 'Family of Three',
    'family-of-four': 'Family of Four',
    'male': '♂ Male',
    'female': '♀ Female',
    'roaming': 'Roaming',
    'chest': 'Chest',
  },
};

export const formatFormLabel = (rawFormName, baseName, lang = 'es') => {
  if (!rawFormName) {
    return lang === 'es' ? 'Base' : 'Base';
  }

  const cleanRaw = String(rawFormName).toLowerCase().trim();
  const cleanBase = String(baseName || '').toLowerCase().trim();

  if (cleanRaw === cleanBase) {
    return lang === 'es' ? 'Base' : 'Base';
  }

  // Extraer el sufijo quitando el nombre base del Pokémon
  let suffix = cleanRaw;
  if (cleanBase && cleanRaw.startsWith(`${cleanBase}-`)) {
    suffix = cleanRaw.slice(cleanBase.length + 1);
  }

  const dict = FORM_LABELS[lang] || FORM_LABELS.es;

  if (dict[suffix]) return dict[suffix];

  // Fallback limpio capitalizado (ej. 'rock-star' -> 'Rock Star')
  return suffix
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Obtiene TODAS las variantes (species.varieties + pokemon.forms cosméticas) sin filtros restrictivos
 * Combina speciesData.varieties con basePokemon.forms
 */
export const getAllPokemonVariants = async (basePokemon, speciesData) => {
  const variantsMap = new Map();

  // 1. Agregar todas las variedades de speciesData.varieties (SIN filtrar ni excluir ninguna)
  if (speciesData?.varieties?.length > 0) {
    for (const v of speciesData.varieties) {
      // Excluir únicamente formas totem de Alola ('-totem') si duplican el modelo, pero conservar TODO lo demás
      const vName = v.pokemon ? v.pokemon.name : v.name;
      const vUrl = v.pokemon ? v.pokemon.url : v.url;
      const isDef = v.is_default ?? v.isDefault ?? false;
      if (vName && !vName.includes('-totem')) {
        variantsMap.set(vName, {
          name: vName,
          url: vUrl,
          sourceType: 'variety',
          type: 'variety',
          isDefault: isDef,
        });
      }
    }
  }

  // 2. Agregar todas las formas cosméticas de basePokemon.forms (ej. morpeko-hangry, pichu-spiky-eared)
  if (basePokemon?.forms?.length > 0) {
    for (const f of basePokemon.forms) {
      if (!variantsMap.has(f.name) && !f.name.includes('-totem')) {
        variantsMap.set(f.name, {
          name: f.name,
          url: f.url,
          sourceType: 'form',
          type: 'form',
          isDefault: false,
        });
      }
    }
  }

  return Array.from(variantsMap.values());
};

export const getAllPokemonForms = getAllPokemonVariants;

/**
 * Resuelve y normaliza los datos completos de una variedad de combate o forma cosmética
 * @param {object} formItem - { name, url, sourceType, type, isDefault }
 * @param {object} basePokemonData - Datos completos del Pokémon base
 * @returns {Promise<object>} Objeto con estructura de Pokémon listo para visualización
 */
export const resolvePokemonFormData = async (formItem, basePokemonData) => {
  if (!formItem) return basePokemonData;

  const itemType = formItem.sourceType || formItem.type;

  // Si es una variedad completa (/pokemon/{name})
  if (itemType === 'variety') {
    return await getPokemonFormData(formItem.url || formItem.name);
  }

  // Si es una forma cosmética (/pokemon-form/{name})
  if (itemType === 'form' || itemType === 'cosmetic-form') {
    const key = String(formItem.url || formItem.name).trim();
    const url = key.startsWith('http')
      ? key
      : `${BASE_URL}/pokemon-form/${key.toLowerCase()}`;

    let formData;
    if (formsCache[url]) {
      formData = formsCache[url];
    } else {
      const response = await axios.get(url);
      formData = response.data;
      formsCache[url] = formData;
    }

    const formId = formData.id;
    const hdArtwork =
      formData.sprites?.other?.['official-artwork']?.front_default ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${formId}.png`;
    const hdShiny =
      formData.sprites?.other?.['official-artwork']?.front_shiny ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${formId}.png`;

    return {
      ...basePokemonData,
      name: formData.name || formItem.name,
      formId: formId,
      types:
        formData.types && formData.types.length > 0
          ? formData.types.map((t) => ({
              slot: t.slot,
              type: { name: t.type?.name || t.name },
            }))
          : basePokemonData.types,
      sprites: {
        ...basePokemonData.sprites,
        front_default: formData.sprites?.front_default || basePokemonData.sprites?.front_default,
        front_shiny: formData.sprites?.front_shiny || basePokemonData.sprites?.front_shiny,
        other: {
          ...basePokemonData.sprites?.other,
          'official-artwork': {
            front_default: hdArtwork,
            front_shiny: hdShiny,
          },
          home: {
            ...basePokemonData.sprites?.other?.home,
            front_default:
              formData.sprites?.other?.home?.front_default ||
              basePokemonData.sprites?.other?.home?.front_default,
            front_shiny:
              formData.sprites?.other?.home?.front_shiny ||
              basePokemonData.sprites?.other?.home?.front_shiny,
          },
        },
      },
    };
  }

  return await getPokemonFormData(formItem.url || formItem.name);
};

/**
 * Convierte nombres con sufijos técnicos a su nombre de especie limpio
 * Convierte 'mimikyu-disguised' -> 'Mimikyu', 'eiscue-ice' -> 'Eiscue', 'morpeko-full-belly' -> 'Morpeko'
 * Respeta nombres compuestos reales como 'ho-oh', 'porygon-z', 'jangmo-o', 'tapu-koko', 'type-null', 'mr-mime', 'iron-valiant'
 */
export const getCleanSpeciesName = (pokemon) => {
  if (pokemon?.species?.name) {
    const spName = pokemon.species.name;
    const compoundExceptions = ['ho-oh', 'porygon-z', 'jangmo-o', 'hakamo-o', 'kommo-o', 'type-null', 'wo-chien', 'chien-pao', 'ting-lu', 'chi-yu'];
    if (compoundExceptions.includes(spName.toLowerCase())) {
      return spName;
    }
    return spName.replace(/-/g, ' ');
  }
  const nameStr = typeof pokemon === 'string' ? pokemon : pokemon?.name || '';
  if (!nameStr) return '';
  return nameStr
    .replace(/-(disguised|ice|full-belly|normal|standard|incarnate|altered|aria|ordinary|shield|solo|overcast|plant|50|red-meteor|baile|midday|amped|single-strike|family-of-four|curly|two-segment|green-plumage|counterfeit|Hearthflame|Wellspring|Cornerstone)$/i, '');
};

export const formatCleanPokemonName = getCleanSpeciesName;

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
 * @param {string|number|object} pokemonIdOrName - Objeto Pokémon, ID o nombre
 * @returns {Promise<string[]>} Array lineal con los nombres de la línea evolutiva
 */
export const getPokemonEvolutions = async (pokemonIdOrName) => {
  try {
    const speciesData = await getPokemonSpecies(pokemonIdOrName);
    const evolutionChainUrl = speciesData?.evolution_chain?.url;

    if (!evolutionChainUrl) {
      const fallbackName = typeof pokemonIdOrName === 'object'
        ? (pokemonIdOrName.name || pokemonIdOrName.id)
        : String(pokemonIdOrName).split('-')[0].toLowerCase().trim();
      return [fallbackName];
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
 * @param {object} pokemon - Datos del Pokémon
 * @param {boolean} isShiny - Si es variante variocolor
 * @param {string} gender - 'male' | 'female'
 */
export const getHighResArtwork = (pokemon, isShiny = false, gender = 'male') => {
  if (!pokemon) return '';
  if (gender === 'female') {
    if (isShiny) {
      return (
        pokemon.sprites?.other?.home?.front_shiny_female ||
        pokemon.sprites?.other?.['official-artwork']?.front_shiny_female ||
        pokemon.sprites?.front_shiny_female ||
        pokemon.sprites?.other?.home?.front_female ||
        pokemon.sprites?.front_female ||
        pokemon.sprites?.other?.['official-artwork']?.front_shiny ||
        pokemon.sprites?.other?.home?.front_shiny ||
        pokemon.sprites?.front_shiny ||
        ''
      );
    }
    return (
      pokemon.sprites?.other?.home?.front_female ||
      pokemon.sprites?.other?.['official-artwork']?.front_female ||
      pokemon.sprites?.front_female ||
      pokemon.sprites?.other?.['official-artwork']?.front_default ||
      pokemon.sprites?.other?.home?.front_default ||
      pokemon.sprites?.front_default ||
      ''
    );
  }
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
