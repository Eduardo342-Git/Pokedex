import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import {
  getPokemonDetails,
  getPokemonTypeRelations,
  getPokemonSpeciesData,
  getAbilityName,
  getPokemonFormData,
  getHighResArtwork,
  categorizeAndTranslateMoves,
} from '../services/pokemonService';
import { TYPE_COLORS, TYPE_PASTEL_COLORS, TYPE_BORDER_COLORS } from '../utils/pokemonTypes';
import { UI_TRANSLATIONS, TYPE_NAMES } from '../utils/translations';
import PokeballWatermark from './PokeballWatermark';
import TypeDecorations from './TypeDecorations';
import TypeParticles from './TypeParticles';
import StatRadarChart from './StatRadarChart';

const STAT_LABELS = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
};

const HABITAT_CONFIG = {
  space: { es: '🌌 Espacio Exterior', en: '🌌 Outer Space' },
  mythical: { es: '✨ Mítico Desconocido', en: '✨ Mythical Realm' },
  legendary: { es: '👑 Santuario Ancestral', en: '👑 Ancient Sanctuary' },
  forest: { es: '🌲 Bosque', en: '🌲 Forest' },
  grassland: { es: '🌿 Pradera', en: '🌿 Grassland' },
  mountain: { es: '⛰️ Montaña', en: '⛰️ Mountain' },
  sea: { es: '🌊 Mar', en: '🌊 Sea' },
  cave: { es: '🪨 Cueva', en: '🪨 Cave' },
  urban: { es: '🏙️ Urbano', en: '🏙️ Urban' },
  'waters-edge': { es: '🏖️ Orilla del Agua', en: "🏖️ Water's Edge" },
  'rough-terrain': { es: '🏜️ Terreno Escarpado', en: '🏜️ Rough Terrain' },
  swamp: { es: '🍄 Pantano', en: '🍄 Swamp' },
  spooky: { es: '🕯️ Lugares Sombríos', en: '🕯️ Haunted Areas' },
  rare: { es: '🔮 Hábitat Raro', en: '🔮 Rare Habitat' },
  unknown: { es: '❓ Desconocido', en: '❓ Unknown' },
};

const getBarColor = (value) => {
  if (value < 70) return '#f59e0b';
  if (value <= 100) return '#22c55e';
  return '#06b6d4';
};

function PokemonModal({ pokemon, onClose, onSelectPokemon, language = 'es' }) {
  // Gestión de estados locales en el modal
  const [currentPokemon, setCurrentPokemon] = useState(pokemon);
  const [prevPokemonProp, setPrevPokemonProp] = useState(pokemon);
  const [activeVariety, setActiveVariety] = useState(null); // guarda los datos del pokemon de la forma activa
  const [availableVarieties, setAvailableVarieties] = useState([]);
  const [statView, setStatView] = useState('bars'); // 'bars' | 'radar'
  const [typeRelations, setTypeRelations] = useState({
    strongAgainst: [],
    weakAgainst: [],
    notEffectiveAgainst: [],
  });
  const [speciesInfo, setSpeciesInfo] = useState(null);
  const [isShiny, setIsShiny] = useState(false);
  const [loadingCombatData, setLoadingCombatData] = useState(false);
  const [loadingSpecies, setLoadingSpecies] = useState(false);
  const [lensFlash, setLensFlash] = useState(false);
  const [translatedAbilities, setTranslatedAbilities] = useState([]);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'moves'
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);
  const [moveCategory, setMoveCategory] = useState('levelUp'); // 'levelUp' | 'machine' | 'egg'
  const [categorizedMoves, setCategorizedMoves] = useState({ levelUp: [], machine: [], egg: [], tutor: [] });
  const [isScanning, setIsScanning] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [spawnKey, setSpawnKey] = useState('');
  const prevPokemonNameRef = useRef(currentPokemon?.name);
  const currentPokemonRef = useRef(currentPokemon);

  useEffect(() => {
    currentPokemonRef.current = currentPokemon;
  }, [currentPokemon]);

  const isLoading = loadingCombatData || loadingSpecies || isLoadingMoves;

  const isRare = Boolean(
    speciesInfo?.isLegendary ||
    speciesInfo?.isMythical ||
    activeVariety?.name?.includes('mega') ||
    activeVariety?.name?.includes('gmax')
  );

  // Forma activa (displayPokemon toma la variedad seleccionada o el Pokémon base)
  const displayPokemon = activeVariety || currentPokemon;
  const currentSpriteKey = `${displayPokemon?.name}-${isShiny}`;
  const isSpawned = spawnKey === currentSpriteKey;

  // Disparador del escáner láser holográfico al cambiar espécimen o variedad
  useEffect(() => {
    let active = true;
    const startTimer = setTimeout(() => {
      if (active) setIsScanning(true);
    }, 0);
    const endTimer = setTimeout(() => {
      if (active) setIsScanning(false);
    }, 850);
    return () => {
      active = false;
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [displayPokemon?.name]);

  // Secuencia de materialización Pokéball al cambiar Pokémon o vista Shiny
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) setSpawnKey(currentSpriteKey);
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentSpriteKey]);

  // Cierre cinemático con reabsorción Pokéball antes de desmontar el modal
  const handleCloseWithAnimation = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 420);
  }, [isClosing, onClose]);

  // Carga reactiva de movimientos categorizados y traducidos oficiales
  useEffect(() => {
    let isMounted = true;

    if ((activeTab === 'moves' || activeTab === 'movimientos') && displayPokemon?.moves) {
      const loadTimer = setTimeout(() => {
        if (isMounted) setIsLoadingMoves(true);
      }, 0);

      categorizeAndTranslateMoves(displayPokemon.moves, language)
        .then((res) => {
          if (isMounted) {
            setCategorizedMoves(res);
            setIsLoadingMoves(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoadingMoves(false);
          }
        });

      return () => {
        isMounted = false;
        clearTimeout(loadTimer);
      };
    }
  }, [displayPokemon?.name, displayPokemon?.moves, activeTab, language]);

  const getFormLabel = (rawName, baseName) => {
    if (rawName === baseName) return language === 'es' ? 'Base' : 'Standard';
    const clean = rawName.replace(`${baseName}-`, '');
    if (clean.includes('mega-x')) return 'Mega X';
    if (clean.includes('mega-y')) return 'Mega Y';
    if (clean.includes('mega')) return 'Mega';
    if (clean.includes('gmax')) return 'Gigamax';
    if (clean.includes('alola')) return 'Alola';
    if (clean.includes('galar')) return 'Galar';
    if (clean.includes('hisui')) return 'Hisui';
    if (clean.includes('paldea')) return 'Paldea';
    return clean.toUpperCase();
  };

  // Sincronizar si cambia la prop pokemon externamente sin efecto en cascada
  if (pokemon !== prevPokemonProp) {
    setPrevPokemonProp(pokemon);
    setCurrentPokemon(pokemon);
    setActiveVariety(null);
    setIsShiny(false);
  }

  // Navegación por D-Pad / ID
  const handleNavigateId = async (targetId) => {
    if (targetId < 1 || loadingCombatData || loadingSpecies) return;
    try {
      setLoadingCombatData(true);
      const updated = await getPokemonDetails(targetId);
      setCurrentPokemon(updated);
      setActiveVariety(null);
      setIsShiny(false);
      if (onSelectPokemon) {
        onSelectPokemon(updated);
      }
    } catch (err) {
      console.error('Error al navegar por D-Pad:', err);
    } finally {
      setLoadingCombatData(false);
    }
  };

  const handleNavigateIdRef = useRef(handleNavigateId);
  useEffect(() => {
    handleNavigateIdRef.current = handleNavigateId;
  });

  // Cierre con la tecla Escape y navegación física por teclado (flechas izquierda/derecha)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        handleCloseWithAnimation();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const cur = currentPokemonRef.current;
        if (cur && cur.id > 1) {
          handleNavigateIdRef.current(cur.id - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const cur = currentPokemonRef.current;
        if (cur && cur.id) {
          handleNavigateIdRef.current(cur.id + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleCloseWithAnimation]);

  // Carga reactiva de especie, variedades y evolución al cambiar currentPokemon o language
  useEffect(() => {
    let isMounted = true;
    if (!currentPokemon) return;

    const loadData = async () => {
      try {
        if (prevPokemonNameRef.current !== currentPokemon.name) {
          prevPokemonNameRef.current = currentPokemon.name;
          if (isMounted) {
            setIsShiny(false);
            setActiveVariety(null);
          }
        }
        if (isMounted) setLoadingSpecies(true);
        const currentPrimaryType = currentPokemon.types?.[0]?.type?.name || 'normal';
        const species = await getPokemonSpeciesData(currentPokemon.name, language, currentPrimaryType);

        if (isMounted) {
          setSpeciesInfo(
            species || {
              description: '',
              genus: '',
              varieties: [],
              habitat: 'unknown',
              evolutionChain: [],
              isLegendary: false,
              isMythical: false,
            }
          );
          setAvailableVarieties(species?.varieties || []);
        }
      } catch (error) {
        console.error('Error cargando datos de Pokémon:', error);
      } finally {
        if (isMounted) setLoadingSpecies(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentPokemon, language]);

  // Carga reactiva de relaciones de tipo para displayPokemon
  useEffect(() => {
    let isMounted = true;
    if (!displayPokemon) return;

    const loadTypeRelations = async () => {
      try {
        setLoadingCombatData(true);
        const types = displayPokemon.types?.map((t) => t.type.name) || [];
        const relations = await getPokemonTypeRelations(types);
        if (isMounted) {
          setTypeRelations(
            relations || { strongAgainst: [], weakAgainst: [], notEffectiveAgainst: [] }
          );
        }
      } catch (error) {
        console.error('Error cargando relaciones de tipo:', error);
      } finally {
        if (isMounted) {
          setLoadingCombatData(false);
        }
      }
    };

    loadTypeRelations();

    return () => {
      isMounted = false;
    };
  }, [displayPokemon]);

  // Carga reactiva de nombres de habilidades traducidas para displayPokemon
  useEffect(() => {
    let isMounted = true;
    if (!displayPokemon) return;

    const loadAbilities = async () => {
      try {
        const translated = await Promise.all(
          (displayPokemon.abilities || []).map(async (item) => {
            const name = await getAbilityName(item.ability?.url || item.ability?.name, language);
            return {
              name,
              is_hidden: item.is_hidden,
            };
          })
        );
        if (isMounted) {
          setTranslatedAbilities(translated);
        }
      } catch (error) {
        console.error('Error al traducir habilidades:', error);
      }
    };

    loadAbilities();
    return () => {
      isMounted = false;
    };
  }, [displayPokemon, language]);

  if (!currentPokemon) return null;

  // Función de cambio rápido de evolución
  const handleNavigateEvolution = async (targetName) => {
    try {
      setLoadingCombatData(true);
      const updatedPokemon = await getPokemonDetails(targetName);
      setCurrentPokemon(updatedPokemon);
      setActiveVariety(null);
      setIsShiny(false);
      if (onSelectPokemon) {
        onSelectPokemon(updatedPokemon);
      }
    } catch (error) {
      console.error('Error al navegar evolución:', error);
    } finally {
      setLoadingCombatData(false);
    }
  };

  const playCry = () => {
    const audioUrl =
      displayPokemon.cries?.latest ||
      displayPokemon.cries?.legacy ||
      currentPokemon.cries?.latest ||
      currentPokemon.cries?.legacy;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = 0.6;
      audio.play().catch((e) => console.warn('Audio no disponible', e));
    }
  };

  const triggerCryWithFlash = () => {
    playCry();
    setLensFlash(true);
    setTimeout(() => setLensFlash(false), 400);
  };

  const hasCry = Boolean(
    displayPokemon.cries?.latest ||
    displayPokemon.cries?.legacy ||
    currentPokemon.cries?.latest ||
    currentPokemon.cries?.legacy
  );
  const formattedId = `#${String(currentPokemon.id).padStart(3, '0')}`;

  const totalStats =
    displayPokemon.stats?.reduce((acc, curr) => acc + curr.base_stat, 0) || 0;

  const primaryType = displayPokemon.types?.[0]?.type?.name || 'normal';
  const pastelBg = TYPE_PASTEL_COLORS[primaryType] || '#f8fafc';
  const borderColor = TYPE_BORDER_COLORS[primaryType] || '#cbd5e1';

  const isFloating =
    (displayPokemon.types || currentPokemon.types)?.some((t) =>
      ['flying', 'dragon', 'ghost'].includes(t.type.name)
    ) ||
    ['charizard', 'butterfree', 'pidgeot', 'mew', 'mewtwo', 'gengar', 'deoxys'].some((name) =>
      (displayPokemon.name || currentPokemon.name).toLowerCase().includes(name)
    );

  return (
    <div
      onClick={handleCloseWithAnimation}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Estilos para animación de despliegue vertical de la Pokédex y LEDs */}
      <style>{`
        @keyframes pokedexOpenVertical {
          0% {
            opacity: 0;
            transform: scaleY(0.04) scaleX(0.85);
            filter: brightness(1.2);
          }
          50% {
            opacity: 0.85;
            transform: scaleY(0.7) scaleX(0.98);
          }
          75% {
            opacity: 1;
            transform: scaleY(1.03) scaleX(1.01);
          }
          100% {
            opacity: 1;
            transform: scaleY(1) scaleX(1);
            filter: brightness(1);
          }
        }
        @keyframes lensBreathe {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 0 18px #38bdf8, 0 2px 8px rgba(56, 189, 248, 0.6);
          }
        }
        @keyframes blinkYellow {
          0%, 100% {
            opacity: 1;
            background-color: #facc15;
            box-shadow: 0 0 8px #facc15, 0 0 14px rgba(250, 204, 21, 0.6);
          }
          50% {
            opacity: 0.35;
            background-color: #854d0e;
            box-shadow: 0 0 2px #ca8a04;
          }
        }
        @keyframes shinyLedPulse {
          0%, 100% {
            background-color: #fef08a;
            box-shadow: 0 0 8px #facc15, 0 0 14px #eab308;
            transform: scale(1.15);
          }
          50% {
            background-color: #ca8a04;
            box-shadow: 0 0 2px #ca8a04;
            transform: scale(1);
          }
        }
        /* Respiración orgánica para criaturas terrestres */
        @keyframes pokemonLivelyBreath {
          0%, 100% {
            transform: scaleY(1) scaleX(1) translateY(0);
          }
          40% {
            transform: scaleY(1.055) scaleX(0.97) translateY(-3px);
          }
          65% {
            transform: scaleY(0.985) scaleX(1.015) translateY(1px);
          }
        }

        /* Flotación levitante para Pokémon aéreos / voladores */
        @keyframes pokemonLivelyFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(1.2deg);
          }
        }

        /* Sombra dinámica sincronizada */
        @keyframes shadowLivelyPulse {
          0%, 100% {
            transform: scaleX(1) scaleY(1);
            opacity: 0.28;
          }
          50% {
            transform: scaleX(0.82) scaleY(0.8);
            opacity: 0.12;
          }
        }

        /* 1. Escáner Láser Holográfico */
        @keyframes pokedexScanline {
          0% {
            top: 0%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        /* 2. Haz de Luz y Materialización estilo Pokéball */
        @keyframes pokeballBeamSpawn {
          0% {
            transform: scale(0.15);
            filter: brightness(3) drop-shadow(0 0 25px #ffffff);
            opacity: 0;
          }
          45% {
            transform: scale(1.08);
            filter: brightness(2) drop-shadow(0 0 20px #ef4444);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18));
            opacity: 1;
          }
        }

        /* 3. Destello de Reabsorción al Cerrar */
        @keyframes pokeballBeamAbsorb {
          0% {
            transform: scale(1);
            filter: brightness(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            filter: brightness(2.5) drop-shadow(0 0 25px #ef4444);
            opacity: 0.85;
          }
          100% {
            transform: scale(0.05);
            filter: brightness(4) drop-shadow(0 0 40px #ffffff);
            opacity: 0;
          }
        }
        .pokedex-lens-btn {
          cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
        }
        .pokedex-lens-btn:active {
          transform: scale(0.95) !important;
        }
        .pokedex-black-btn {
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.15s ease;
        }
        .pokedex-black-btn:hover {
          filter: brightness(1.2);
        }
        .pokedex-black-btn:active {
          transform: scale(0.92) !important;
          box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.4) !important;
        }
        .dpad-arm {
          cursor: pointer;
          transition: transform 0.1s ease, background-color 0.15s ease, box-shadow 0.1s ease;
          user-select: none;
          -webkit-user-select: none;
        }
        .dpad-arm:hover {
          background-color: #334155 !important;
        }
        .dpad-arm:active {
          transform: scale(0.94) !important;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6) !important;
        }
        .dpad-arm:disabled {
          opacity: 0.35;
          cursor: not-allowed !important;
        }
      `}</style>

      {/* Carcasa Principal Ancha de la Pokédex Doble Pantalla Abatible */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          padding: '20px',
          position: 'relative',
          background: 'linear-gradient(145deg, #dc2626 0%, #b91c1c 100%)',
          border: '4px solid #991b1b',
          borderRadius: '24px',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#0f172a',
          animation: 'pokedexOpenVertical 0.58s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          transformOrigin: 'center center',
        }}
      >
        {/* 1. Cabecera Superior: Gema LED Cian, Luces de Estado y Botón Cerrar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #7f1d1d',
          }}
        >
          {/* Lente principal y 3 luces de estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Lente Azul Grande Reactivo */}
            <button
              type="button"
              className="pokedex-lens-btn"
              onClick={triggerCryWithFlash}
              title={language === 'es' ? 'Reproducir grito oficial' : 'Play official cry'}
              aria-label="Lente de la Pokédex"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid #ffffff',
                background:
                  'radial-gradient(circle at 30% 30%, #38bdf8, #0284c7 70%, #0369a1)',
                boxShadow: lensFlash
                  ? '0 0 25px #ffffff, 0 0 35px #38bdf8'
                  : isLoading
                  ? '0 0 16px #38bdf8'
                  : '0 0 10px rgba(56, 189, 248, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3)',
                animation: isLoading && !lensFlash ? 'lensBreathe 1.5s infinite ease-in-out' : 'none',
                filter: lensFlash ? 'brightness(1.8)' : 'brightness(1)',
                transform: lensFlash ? 'scale(1.08)' : 'scale(1)',
                padding: 0,
                outline: 'none',
              }}
            />

            {/* 3 LEDs indicadores reactivos */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* LED 1: Rojo (Encendido de Pokédex) */}
              <div
                title={language === 'es' ? 'Pokédex activa' : 'Pokédex active'}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 0 5px #ef4444',
                  animation: isShiny ? 'shinyLedPulse 1.2s infinite ease-in-out' : 'none',
                  animationDelay: '0s',
                }}
              />

              {/* LED 2: Amarillo (Alerta de espécimen raro / isRare) */}
              <div
                title={
                  isRare
                    ? language === 'es'
                      ? 'Espécimen raro / legendario / mítico'
                      : 'Rare / legendary / mythical specimen'
                    : language === 'es'
                    ? 'Estado normal'
                    : 'Normal status'
                }
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isRare ? '#facc15' : '#ca8a04',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: isRare ? '0 0 8px #facc15' : 'none',
                  opacity: isRare || isShiny ? 1 : 0.55,
                  animation: isShiny
                    ? 'shinyLedPulse 1.2s infinite ease-in-out'
                    : isRare
                    ? 'blinkYellow 0.8s infinite'
                    : 'none',
                  animationDelay: isShiny ? '0.4s' : '0s',
                }}
              />

              {/* LED 3: Verde (Listo / Carga completada) */}
              <div
                title={
                  isLoading
                    ? language === 'es'
                      ? 'Sincronizando datos...'
                      : 'Syncing data...'
                    : language === 'es'
                    ? 'Datos listos'
                    : 'Data ready'
                }
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isLoading ? '#15803d' : '#22c55e',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: isLoading ? 'none' : '0 0 6px #22c55e',
                  opacity: isLoading ? 0.5 : 1,
                  animation: isShiny ? 'shinyLedPulse 1.2s infinite ease-in-out' : 'none',
                  animationDelay: '0.8s',
                }}
              />
            </div>
          </div>

          {/* Botón de cierre en tono vino/rojo oscuro */}
          <button
            type="button"
            onClick={handleCloseWithAnimation}
            aria-label="Cerrar Pokédex"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#7f1d1d',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991b1b')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7f1d1d')}
          >
            ✕
          </button>
        </div>

        {/* 2. Estructura Interna a Doble Pantalla LCD Adaptable */}
        <div className="pokedex-dual-screen">
          {/* ======================================================== */}
          {/* PANTALLA IZQUIERDA: Visor del Espécimen, Datos y Lore     */}
          {/* ======================================================== */}
          <div
            style={{
              backgroundColor: '#e2e8f0',
              border: '2px solid #cbd5e1',
              borderRadius: '16px',
              padding: '14px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Pequeños puntos rojos superiores estilo LED */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 3px rgba(239, 68, 68, 0.7)',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 3px rgba(239, 68, 68, 0.7)',
                  display: 'inline-block',
                }}
              />
            </div>

            {/* Pantalla interior LCD izquierda con fondo pastel dinámico, llena y sin espacio muerto */}
            <div
              style={{
                backgroundColor: pastelBg,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease',
                border: `3.5px solid ${borderColor}`,
                borderRadius: '18px',
                padding: '16px 18px',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                maxHeight: '62vh',
              }}
            >
              {/* Micro-patrones vectoriales decorativos en las esquinas según el tipo elemental */}
              <TypeDecorations
                type={primaryType}
                color={TYPE_BORDER_COLORS[primaryType] || '#94a3b8'}
              />

              {/* Flujo de partículas elementales flotantes de fondo */}
              <TypeParticles
                type={primaryType}
                color={TYPE_BORDER_COLORS[primaryType] || '#38bdf8'}
              />

              {/* Encabezado: #ID y Nombre agrandados */}
              <div style={{ textAlign: 'center', marginBottom: '4px', position: 'relative', zIndex: 2 }}>
                <span
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#475569',
                    letterSpacing: '0.05em',
                  }}
                >
                  {formattedId}
                </span>
                <h2
                  translate="no"
                  className="notranslate"
                  style={{
                    margin: '2px 0 0',
                    fontSize: '26px',
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                    lineHeight: '1.2',
                  }}
                >
                  {displayPokemon.name}
                </h2>
              </div>

              {/* Selector de Formas Alternativas (Mega, Gigamax, Formas Regionales) */}
              {availableVarieties.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    margin: '6px 0',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {availableVarieties.map((v) => {
                    const isCurrent = (activeVariety?.name || currentPokemon.name) === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={async () => {
                          if (isCurrent) return;
                          try {
                            const data = await getPokemonFormData(v.url);
                            setActiveVariety(data);
                          } catch (err) {
                            console.error('Error al cambiar de forma:', err);
                          }
                        }}
                        style={{
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          border: isCurrent
                            ? `2px solid ${TYPE_BORDER_COLORS[primaryType] || '#0284c7'}`
                            : '1px solid #cbd5e1',
                          backgroundColor: isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                          color: isCurrent ? '#0f172a' : '#64748b',
                          cursor: 'pointer',
                          boxShadow: isCurrent ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        {getFormLabel(v.name, currentPokemon.name)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selector Shiny ✨ tipo píldora (encima del sprite) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '4px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsShiny((prev) => !prev)}
                  title={
                    isShiny
                      ? language === 'es'
                        ? 'Ver forma normal'
                        : 'View normal form'
                      : language === 'es'
                      ? 'Ver forma variocolor (Shiny)'
                      : 'View shiny form'
                  }
                  style={{
                    backgroundColor: isShiny ? '#fef08a' : '#f1f5f9',
                    color: isShiny ? '#854d0e' : '#475569',
                    border: isShiny ? '1px solid #facc15' : '1px solid #cbd5e1',
                    borderRadius: '9999px',
                    padding: '3px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: isShiny ? '0 2px 4px rgba(234, 179, 8, 0.25)' : 'none',
                  }}
                >
                  {isShiny ? UI_TRANSLATIONS[language].shiny : UI_TRANSLATIONS[language].normal}
                </button>
              </div>

              {/* Sprite Oficial centrado y agrandado con Pokéball concéntrica */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '4px 0',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '16px',
                  minHeight: '180px',
                  zIndex: 2,
                }}
              >
                {/* Escáner Láser Holográfico de Diagnóstico */}
                {isScanning && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '5%',
                      width: '90%',
                      height: '3px',
                      background: `linear-gradient(90deg, transparent, #ffffff, ${TYPE_BORDER_COLORS[primaryType] || '#38bdf8'}, #ffffff, transparent)`,
                      boxShadow: `0 0 12px 3px ${TYPE_BORDER_COLORS[primaryType] || '#38bdf8'}`,
                      zIndex: 5,
                      pointerEvents: 'none',
                      animation: 'pokedexScanline 0.8s ease-in-out forwards',
                    }}
                  />
                )}

                <PokeballWatermark
                  size="210px"
                  opacity={0.30}
                  color={TYPE_BORDER_COLORS[primaryType] || '#94a3b8'}
                />
                <img
                  key={`${displayPokemon.id}-${displayPokemon.name}-${isShiny}`}
                  src={getHighResArtwork(displayPokemon, isShiny)}
                  alt={displayPokemon.name}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'pokeballBeamSpawn') {
                      setSpawnKey(currentSpriteKey);
                    }
                  }}
                  style={{
                    height: 'clamp(155px, 16vw, 190px)',
                    maxHeight: '195px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18))',
                    animation: isClosing
                      ? 'pokeballBeamAbsorb 0.42s ease-in forwards'
                      : !isSpawned
                        ? 'pokeballBeamSpawn 0.5s cubic-bezier(0.18, 0.9, 0.32, 1.2) forwards'
                        : isFloating
                          ? 'pokemonLivelyFloat 2.8s ease-in-out infinite'
                          : 'pokemonLivelyBreath 2.6s ease-in-out infinite',
                    transformOrigin: 'bottom center',
                    position: 'relative',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                />
                {/* Sombra dinámica sincronizada */}
                <div
                  style={{
                    width: '90px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    margin: '-6px auto 0 auto',
                    animation: isClosing ? 'none' : 'shadowLivelyPulse 2.8s ease-in-out infinite',
                    opacity: isClosing ? 0 : undefined,
                    transition: 'opacity 0.2s ease',
                    zIndex: 1,
                  }}
                />
              </div>

              {/* Badges de Tipos Oficiales */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '6px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {displayPokemon.types?.map(({ type }) => {
                  const color = TYPE_COLORS[type.name] || { bg: '#64748b', text: '#ffffff' };
                  const translatedType = TYPE_NAMES[language]?.[type.name] || type.name;
                  return (
                    <span
                      key={type.name}
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {translatedType}
                    </span>
                  );
                })}
              </div>

              {/* Botón de Audio Nativo y Género */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  flexWrap: 'wrap',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  onClick={playCry}
                  disabled={!hasCry}
                  style={{
                    backgroundColor: hasCry ? '#0284c7' : '#94a3b8',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    padding: '4px 14px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: hasCry ? 'pointer' : 'not-allowed',
                    opacity: hasCry ? 1 : 0.6,
                    transition: 'background-color 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: hasCry ? '0 2px 6px rgba(2, 132, 199, 0.35)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (hasCry) e.currentTarget.style.backgroundColor = '#0369a1';
                  }}
                  onMouseLeave={(e) => {
                    if (hasCry) e.currentTarget.style.backgroundColor = '#0284c7';
                  }}
                >
                  🔊 {UI_TRANSLATIONS[language].listenCry}
                </button>
                {speciesInfo?.genus && (
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: '#475569',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {speciesInfo.genus}
                  </span>
                )}
              </div>

              {/* Medidas Físicas (Grid de 2 columnas compacto) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '6px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    📏 {UI_TRANSLATIONS[language].height}
                  </span>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#0f172a',
                    }}
                  >
                    {(displayPokemon.height / 10).toFixed(1)} m
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    ⚖️ {UI_TRANSLATIONS[language].weight}
                  </span>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#0f172a',
                    }}
                  >
                    {(displayPokemon.weight / 10).toFixed(1)} kg
                  </p>
                </div>
              </div>

              {/* Cápsula de Hábitat Natural */}
              {speciesInfo?.habitat && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${TYPE_BORDER_COLORS[primaryType] || '#cbd5e1'}40`,
                    color: '#334155',
                    margin: '6px auto',
                    alignSelf: 'center',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <span>{language === 'es' ? 'Hábitat:' : 'Habitat:'}</span>
                  <span>
                    {HABITAT_CONFIG[speciesInfo.habitat]?.[language] ||
                      HABITAT_CONFIG.rare[language]}
                  </span>
                </div>
              )}

              {/* Caja de Texto de la Pokédex (Lore) con altura balanceada */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.88)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    lineHeight: '1.45',
                    color: '#334155',
                    fontStyle: 'italic',
                  }}
                >
                  "{speciesInfo?.description || (language === 'es' ? 'Cargando datos de la Pokédex...' : 'Loading Pokédex data...')}"
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PANTALLA DERECHA: Consola de Datos, Combate y Evolución  */}
          {/* ======================================================== */}
          <div
            style={{
              backgroundColor: '#e2e8f0',
              border: '2px solid #cbd5e1',
              borderRadius: '16px',
              padding: '14px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Pequeños puntos rojos superiores estilo LED */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 3px rgba(239, 68, 68, 0.7)',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 3px rgba(239, 68, 68, 0.7)',
                  display: 'inline-block',
                }}
              />
            </div>

            {/* Pantalla interior LCD derecha con fondo pastel dinámico y ajuste sin scroll */}
            <div
              style={{
                backgroundColor: pastelBg,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease',
                border: `3.5px solid ${borderColor}`,
                borderRadius: '18px',
                padding: '10px 14px',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                maxHeight: '62vh',
              }}
            >
              {/* Micro-patrones vectoriales decorativos en las esquinas según el tipo elemental */}
              <TypeDecorations
                type={primaryType}
                color={TYPE_BORDER_COLORS[primaryType] || '#94a3b8'}
              />

              {/* Flujo de partículas elementales flotantes de fondo */}
              <TypeParticles
                type={primaryType}
                color={TYPE_BORDER_COLORS[primaryType] || '#38bdf8'}
              />

              {/* Marca de agua Pokéball centrada sutil y grande */}
              <PokeballWatermark
                size="260px"
                opacity={0.10}
                color={TYPE_BORDER_COLORS[primaryType] || '#94a3b8'}
              />

              {/* Pestañas de Navegación: Información / Movimientos */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '10px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  paddingBottom: '8px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  style={{
                    flex: 1,
                    padding: '7px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'info' ? '#e11d48' : 'rgba(255, 255, 255, 0.75)',
                    color: activeTab === 'info' ? '#ffffff' : '#475569',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'info' ? '0 2px 6px rgba(225, 29, 72, 0.3)' : 'none',
                  }}
                >
                  {language === 'es' ? 'Información' : 'Information'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('moves')}
                  style={{
                    flex: 1,
                    padding: '7px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'moves' ? '#e11d48' : 'rgba(255, 255, 255, 0.75)',
                    color: activeTab === 'moves' ? '#ffffff' : '#475569',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'moves' ? '0 2px 6px rgba(225, 29, 72, 0.3)' : 'none',
                  }}
                >
                  {language === 'es' ? 'Movimientos' : 'Moves'}
                </button>
              </div>

              {/* Contenido de la pestaña activa */}
              <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                {activeTab === 'info' && (
                  <div>
                    {/* Sección: HABILIDADES (ubicada justo arriba de Eficacia en Combate) */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '6px',
                        }}
                      >
                        {UI_TRANSLATIONS[language].abilities}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {translatedAbilities.length > 0
                          ? translatedAbilities.map((ab, index) => (
                              <span
                                key={index}
                                style={{
                                  backgroundColor: ab.is_hidden ? '#fef3c7' : '#f1f5f9',
                                  color: ab.is_hidden ? '#92400e' : '#334155',
                                  border: `1px solid ${ab.is_hidden ? '#fde68a' : '#cbd5e1'}`,
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                }}
                              >
                                {ab.name} {ab.is_hidden && (language === 'es' ? '(Oculta)' : '(Hidden)')}
                              </span>
                            ))
                          : displayPokemon.abilities?.map(({ ability, is_hidden }, index) => (
                              <span
                                key={index}
                                style={{
                                  backgroundColor: is_hidden ? '#fef3c7' : '#f1f5f9',
                                  color: is_hidden ? '#92400e' : '#334155',
                                  border: `1px solid ${is_hidden ? '#fde68a' : '#cbd5e1'}`,
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                }}
                              >
                                {ability.name.replace(/-/g, ' ')}{' '}
                                {is_hidden && (language === 'es' ? '(Oculta)' : '(Hidden)')}
                              </span>
                            ))}
                      </div>
                    </div>

                    {/* Sección: Eficacia en Combate */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{UI_TRANSLATIONS[language].combatEfficiency}</span>
                        {loadingCombatData && (
                          <span style={{ fontSize: '0.65rem', color: '#0284c7', textTransform: 'none' }}>
                            {UI_TRANSLATIONS[language].syncing}
                          </span>
                        )}
                      </div>

                      {/* Fila 1: 💥 Fuerte contra */}
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>💥</span>
                          <span>{UI_TRANSLATIONS[language].strongAgainst}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '18px' }}>
                          {typeRelations.strongAgainst && typeRelations.strongAgainst.length > 0 ? (
                            typeRelations.strongAgainst.map((typeName) => {
                              const color = TYPE_COLORS[typeName] || { bg: '#64748b', text: '#ffffff' };
                              const translatedTypeName = TYPE_NAMES[language]?.[typeName] || typeName;
                              return (
                                <span
                                  key={typeName}
                                  style={{
                                    backgroundColor: color.bg,
                                    color: color.text,
                                    padding: '2px 7px',
                                    borderRadius: '9999px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                  }}
                                >
                                  {translatedTypeName}
                                </span>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              {UI_TRANSLATIONS[language].none}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fila 2: 🛡️ Débil ante */}
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>🛡️</span>
                          <span>{UI_TRANSLATIONS[language].weakAgainst}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '18px' }}>
                          {typeRelations.weakAgainst && typeRelations.weakAgainst.length > 0 ? (
                            typeRelations.weakAgainst.map((typeName) => {
                              const color = TYPE_COLORS[typeName] || { bg: '#64748b', text: '#ffffff' };
                              const translatedTypeName = TYPE_NAMES[language]?.[typeName] || typeName;
                              return (
                                <span
                                  key={typeName}
                                  style={{
                                    backgroundColor: color.bg,
                                    color: color.text,
                                    padding: '2px 7px',
                                    borderRadius: '9999px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                  }}
                                >
                                  {translatedTypeName}
                                </span>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              {UI_TRANSLATIONS[language].none}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fila 3: ⛔ Ineficaz contra */}
                      <div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>⛔</span>
                          <span>{UI_TRANSLATIONS[language].notEffectiveAgainst}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '18px' }}>
                          {typeRelations.notEffectiveAgainst &&
                          typeRelations.notEffectiveAgainst.length > 0 ? (
                            typeRelations.notEffectiveAgainst.map((typeName) => {
                              const color = TYPE_COLORS[typeName] || { bg: '#64748b', text: '#ffffff' };
                              const translatedTypeName = TYPE_NAMES[language]?.[typeName] || typeName;
                              return (
                                <span
                                  key={typeName}
                                  style={{
                                    backgroundColor: color.bg,
                                    color: color.text,
                                    padding: '2px 7px',
                                    borderRadius: '9999px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                  }}
                                >
                                  {translatedTypeName}
                                </span>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              {UI_TRANSLATIONS[language].none}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección: Estadísticas Base */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {UI_TRANSLATIONS[language].baseStats}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setStatView((prev) => (prev === 'bars' ? 'radar' : 'bars'))
                            }
                            style={{
                              backgroundColor: 'rgba(241, 245, 249, 0.95)',
                              border: '1px solid #cbd5e1',
                              borderRadius: '12px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            {statView === 'bars' ? '🕸️ Radar' : '📊 Barras'}
                          </button>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: '#0f172a',
                            }}
                          >
                            {UI_TRANSLATIONS[language].total}: {totalStats}
                          </span>
                        </div>
                      </div>

                      {statView === 'radar' ? (
                        <div style={{ padding: '4px 0' }}>
                          <StatRadarChart
                            stats={displayPokemon.stats?.map((s) => s.base_stat) || []}
                            color={TYPE_BORDER_COLORS[primaryType] || '#22c55e'}
                            size={185}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {displayPokemon.stats?.map((s) => {
                            const label = STAT_LABELS[s.stat.name] || s.stat.name.toUpperCase();
                            const val = s.base_stat;
                            const percentage = Math.min(100, (val / 255) * 100);
                            const barColor = getBarColor(val);

                            return (
                              <div
                                key={s.stat.name}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '50px 28px 1fr',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.72rem',
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#64748b' }}>{label}</span>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    textAlign: 'right',
                                  }}
                                >
                                  {val}
                                </span>
                                <div
                                  style={{
                                    height: '6px',
                                    backgroundColor: '#e2e8f0',
                                    borderRadius: '9999px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${percentage}%`,
                                      backgroundColor: barColor,
                                      borderRadius: '9999px',
                                      transition: 'width 0.4s ease',
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'moves' && (
                  <div
                    className="pokemon-moves-scroll"
                    style={{
                      maxHeight: '340px',
                      overflowY: 'auto',
                      paddingRight: '6px',
                    }}
                  >
                    {/* Barra de Selección y Filtro de Categorías */}
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
                      {[
                        { id: 'levelUp', label: language === 'es' ? 'Nivel' : 'Level', count: categorizedMoves.levelUp?.length || 0 },
                        { id: 'machine', label: language === 'es' ? 'MT / MO' : 'TM / HM', count: categorizedMoves.machine?.length || 0 },
                        { id: 'egg', label: language === 'es' ? 'Huevo' : 'Egg', count: categorizedMoves.egg?.length || 0 }
                      ].map((cat) => {
                        const isActive = moveCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setMoveCategory(cat.id)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              borderRadius: '10px',
                              border: isActive ? `2px solid ${TYPE_BORDER_COLORS[primaryType] || '#ef4444'}` : '1px solid #cbd5e1',
                              backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                              color: isActive ? '#0f172a' : '#64748b',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {cat.label} ({cat.count})
                          </button>
                        );
                      })}
                    </div>

                    {isLoadingMoves ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '40px 10px',
                          color: '#64748b',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#0284c7',
                            animation: 'lensBreathe 1s infinite',
                          }}
                        />
                        <span>
                          {language === 'es' ? 'Cargando movimientos clasificados...' : 'Loading moves...'}
                        </span>
                      </div>
                    ) : (categorizedMoves[moveCategory] && categorizedMoves[moveCategory].length > 0) ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                          gap: '8px',
                          maxHeight: '280px',
                          overflowY: 'auto',
                          padding: '6px',
                        }}
                      >
                        {categorizedMoves[moveCategory].map((item, idx) => (
                          <div
                            key={`${item.rawName}-${idx}`}
                            style={{
                              backgroundColor: '#ffffff',
                              border: `1px solid ${TYPE_BORDER_COLORS[primaryType] || '#cbd5e1'}40`,
                              borderRadius: '8px',
                              padding: '6px 8px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11.5px',
                                fontWeight: '600',
                                color: '#1e293b',
                                textTransform: 'capitalize',
                              }}
                            >
                              {item.displayName}
                            </span>
                            {moveCategory === 'levelUp' && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  color: '#0284c7',
                                  fontWeight: '700',
                                  marginTop: '2px',
                                }}
                              >
                                {language === 'es' ? `Nv. ${item.level}` : `Lv. ${item.level}`}
                              </span>
                            )}
                            {moveCategory === 'machine' && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  color: '#7c3aed',
                                  fontWeight: '700',
                                  marginTop: '2px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                💿 {language === 'es' ? 'MT / MO' : 'TM / HM'}
                              </span>
                            )}
                            {moveCategory === 'egg' && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  color: '#d97706',
                                  fontWeight: '700',
                                  marginTop: '2px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                🥚 {language === 'es' ? 'Huevo' : 'Egg'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '28px 12px',
                          color: '#94a3b8',
                          fontSize: '12px',
                          fontStyle: 'italic',
                        }}
                      >
                        {language === 'es'
                          ? 'No aprende movimientos por este método.'
                          : 'No moves learned by this method.'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cadena Evolutiva Visual Interactiva */}
              {speciesInfo?.evolutionChain && speciesInfo.evolutionChain.length > 1 && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.88)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '12px',
                    padding: '6px 10px',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {speciesInfo.evolutionChain.map((evo, idx) => {
                    const isActive = currentPokemon.name.toLowerCase() === evo.name.toLowerCase();
                    return (
                      <Fragment key={evo.name}>
                        {idx > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 2px',
                            }}
                          >
                            {(evo.requirement || evo.trigger) && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: '700',
                                  color: '#0284c7',
                                  textTransform: 'capitalize',
                                  whiteSpace: 'nowrap',
                                  lineHeight: '1',
                                  marginBottom: '2px',
                                }}
                              >
                                {evo.requirement || evo.trigger}
                              </span>
                            )}
                            <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1' }}>
                              ➔
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleNavigateEvolution(evo.name)}
                          disabled={loadingCombatData || isActive}
                          title={`${evo.name} (#${evo.id})`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: isActive
                              ? 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'
                              : 'transparent',
                            border: isActive
                              ? `2.5px solid ${TYPE_BORDER_COLORS[primaryType] || '#0284c7'}`
                              : '1.5px solid transparent',
                            borderRadius: '10px',
                            padding: '3px 6px',
                            cursor: isActive || loadingCombatData ? 'default' : 'pointer',
                            opacity: loadingCombatData && !isActive ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.12)' : 'none',
                          }}
                        >
                          <img
                            src={evo.sprite}
                            alt={evo.name}
                            style={{
                              width: '36px',
                              height: '36px',
                              objectFit: 'contain',
                              filter: isActive
                                ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                                : 'grayscale(20%)',
                            }}
                          />
                          <span
                            translate="no"
                            className="notranslate"
                            style={{
                              fontSize: '10px',
                              fontWeight: isActive ? '800' : '600',
                              color: isActive ? '#0f172a' : '#64748b',
                              textTransform: 'capitalize',
                              marginTop: '2px',
                            }}
                          >
                            {evo.name}
                          </span>
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Mandos Inferiores Pokédex (Controles de Hardware Funcionales) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            padding: '4px 10px 0',
          }}
        >
          {/* Botón circular grande negro a la izquierda (Disparador manual de Cry) */}
          <button
            type="button"
            className="pokedex-black-btn"
            onClick={triggerCryWithFlash}
            title={language === 'es' ? 'Reproducir grito oficial' : 'Play official cry'}
            aria-label={language === 'es' ? 'Reproducir grito oficial' : 'Play official cry'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              border: '2.5px solid #0f172a',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                'inset 0 2px 4px rgba(255, 255, 255, 0.25), 0 3px 6px rgba(0, 0, 0, 0.5)',
              outline: 'none',
            }}
          >
            {/* Pequeño relieve biselado interior */}
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #334155, #0f172a)',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.15)',
                pointerEvents: 'none',
              }}
            />
          </button>

          {/* Dos líneas horizontales estilo altavoz en el centro */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '4px',
                backgroundColor: '#7f1d1d',
                borderRadius: '2px',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            />
            <div
              style={{
                width: '42px',
                height: '4px',
                backgroundColor: '#7f1d1d',
                borderRadius: '2px',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            />
          </div>

          {/* Cruceta direccional D-Pad interactiva a la derecha */}
          <div
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
            }}
          >
            {/* Barra vertical de fondo (fija) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '14px',
                width: '16px',
                height: '44px',
                backgroundColor: '#1e293b',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
              }}
            />

            {/* Brazo Izquierdo (◀) interactivo */}
            <button
              type="button"
              className="dpad-arm"
              onClick={() => currentPokemon.id > 1 && handleNavigateId(currentPokemon.id - 1)}
              disabled={currentPokemon.id <= 1 || isLoading}
              title={
                language === 'es'
                  ? `Anterior (#${String(Math.max(1, currentPokemon.id - 1)).padStart(3, '0')})`
                  : `Previous (#${String(Math.max(1, currentPokemon.id - 1)).padStart(3, '0')})`
              }
              aria-label="Pokémon anterior"
              style={{
                position: 'absolute',
                top: '14px',
                left: 0,
                width: '16px',
                height: '16px',
                backgroundColor: '#1e293b',
                border: 'none',
                borderTopLeftRadius: '4px',
                borderBottomLeftRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                color: '#94a3b8',
                fontSize: '9px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                zIndex: 2,
                outline: 'none',
              }}
            >
              ◀
            </button>

            {/* Centro del D-Pad (neutro) */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                width: '16px',
                height: '16px',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                }}
              />
            </div>

            {/* Brazo Derecho (▶) interactivo */}
            <button
              type="button"
              className="dpad-arm"
              onClick={() => handleNavigateId(currentPokemon.id + 1)}
              disabled={isLoading}
              title={
                language === 'es'
                  ? `Siguiente (#${String(currentPokemon.id + 1).padStart(3, '0')})`
                  : `Next (#${String(currentPokemon.id + 1).padStart(3, '0')})`
              }
              aria-label="Pokémon siguiente"
              style={{
                position: 'absolute',
                top: '14px',
                right: 0,
                width: '16px',
                height: '16px',
                backgroundColor: '#1e293b',
                border: 'none',
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                color: '#94a3b8',
                fontSize: '9px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                zIndex: 2,
                outline: 'none',
              }}
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PokemonModal;
