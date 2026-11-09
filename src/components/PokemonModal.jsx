import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import {
  getPokemonDetails,
  getPokemonTypeRelations,
  getPokemonSpeciesData,
  getAbilityName,
  getPokemonMovesCategorized,
  getPokemonFormData,
} from '../services/pokemonService';
import { TYPE_COLORS, TYPE_PASTEL_COLORS, TYPE_BORDER_COLORS } from '../utils/pokemonTypes';
import { UI_TRANSLATIONS, TYPE_NAMES } from '../utils/translations';
import PokeballWatermark from './PokeballWatermark';
import TypeDecorations from './TypeDecorations';
import StatRadarChart from './StatRadarChart';

const STAT_LABELS = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
};

const HABITAT_LABELS = {
  cave: { es: '🪨 Cueva', en: '🪨 Cave' },
  forest: { es: '🌲 Bosque', en: '🌲 Forest' },
  grassland: { es: '🌿 Pradera', en: '🌿 Grassland' },
  mountain: { es: '⛰️ Montaña', en: '⛰️ Mountain' },
  rare: { es: '✨ Raro', en: '✨ Rare' },
  'rough-terrain': { es: '🏜️ Terreno Escarpado', en: '🏜️ Rough Terrain' },
  sea: { es: '🌊 Mar', en: '🌊 Sea' },
  urban: { es: '🏙️ Urbano', en: '🏙️ Urban' },
  'waters-edge': { es: '🏖️ Orilla', en: "🏖️ Water's Edge" },
  unknown: { es: '❓ Desconocido', en: '❓ Unknown' },
};

const getBarColor = (value) => {
  if (value < 70) return '#f59e0b';
  if (value <= 100) return '#22c55e';
  return '#06b6d4';
};

function PokemonModal({ pokemon, onClose, language = 'es' }) {
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
  const [translatedAbilities, setTranslatedAbilities] = useState([]);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'moves'
  const prevPokemonNameRef = useRef(currentPokemon?.name);

  // Forma activa (displayPokemon toma la variedad seleccionada o el Pokémon base)
  const displayPokemon = activeVariety || currentPokemon;

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

  // Procesar movimientos categorizados de forma memoizada al cambiar displayPokemon o currentPokemon
  const categorizedMoves = useMemo(() => {
    const moves = displayPokemon?.moves?.length
      ? displayPokemon.moves
      : currentPokemon?.moves || [];
    return getPokemonMovesCategorized(moves);
  }, [displayPokemon, currentPokemon]);

  // Sincronizar si cambia la prop pokemon externamente sin efecto en cascada
  if (pokemon !== prevPokemonProp) {
    setPrevPokemonProp(pokemon);
    setCurrentPokemon(pokemon);
    setActiveVariety(null);
    setIsShiny(false);
  }

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        const species = await getPokemonSpeciesData(currentPokemon.name, language);

        if (isMounted) {
          setSpeciesInfo(
            species || {
              description: '',
              genus: '',
              varieties: [],
              habitat: 'unknown',
              evolutionChain: [],
            }
          );
          setAvailableVarieties(species?.varieties || []);
        }
      } catch (error) {
        console.error('Error cargando datos de Pokémon:', error);
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

  const hasCry = Boolean(
    displayPokemon.cries?.latest ||
    displayPokemon.cries?.legacy ||
    currentPokemon.cries?.latest ||
    currentPokemon.cries?.legacy
  );
  const formattedId = `#${String(currentPokemon.id).padStart(3, '0')}`;

  // Selección reactiva del sprite según isShiny y displayPokemon
  const spriteUrl = isShiny
    ? displayPokemon.sprites?.other?.['official-artwork']?.front_shiny ||
      displayPokemon.sprites?.front_shiny
    : displayPokemon.sprites?.other?.['official-artwork']?.front_default ||
      displayPokemon.sprites?.front_default;

  const totalStats =
    displayPokemon.stats?.reduce((acc, curr) => acc + curr.base_stat, 0) || 0;

  const primaryType = displayPokemon.types?.[0]?.type?.name || 'normal';
  const pastelBg = TYPE_PASTEL_COLORS[primaryType] || '#f8fafc';
  const borderColor = TYPE_BORDER_COLORS[primaryType] || '#cbd5e1';

  return (
    <div
      onClick={onClose}
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
      {/* Estilos para animación de despliegue vertical de la Pokédex */}
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
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '3px solid #ffffff',
                background:
                  'radial-gradient(circle at 30% 30%, #38bdf8, #0284c7 70%, #0369a1)',
                boxShadow:
                  '0 0 10px rgba(56, 189, 248, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#facc15',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 0 4px rgba(250, 204, 21, 0.8)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 0 4px rgba(34, 197, 94, 0.8)',
                }}
              />
            </div>
          </div>

          {/* Botón de cierre en tono vino/rojo oscuro */}
          <button
            type="button"
            onClick={onClose}
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

              {/* Encabezado: #ID y Nombre agrandados */}
              <div style={{ textAlign: 'center', marginBottom: '4px', position: 'relative', zIndex: 1 }}>
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
                    zIndex: 1,
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
                  zIndex: 1,
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
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '4px 0',
                  position: 'relative',
                  minHeight: '180px',
                }}
              >
                <PokeballWatermark
                  size="210px"
                  opacity={0.30}
                  color={TYPE_BORDER_COLORS[primaryType] || '#94a3b8'}
                />
                {spriteUrl ? (
                  <img
                    src={spriteUrl}
                    alt={`${displayPokemon.name}${isShiny ? ' shiny' : ''}`}
                    style={{
                      height: '175px',
                      maxHeight: '185px',
                      width: 'auto',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      filter: isShiny
                        ? 'drop-shadow(0 6px 12px rgba(234, 179, 8, 0.45))'
                        : 'drop-shadow(0 6px 10px rgba(0, 0, 0, 0.16))',
                      transition: 'filter 0.3s ease',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
                ) : (
                  <span style={{ color: '#94a3b8', position: 'relative', zIndex: 1 }}>
                    {UI_TRANSLATIONS[language].noImage}
                  </span>
                )}
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
                  zIndex: 1,
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
                  zIndex: 1,
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
                  zIndex: 1,
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
              {speciesInfo?.habitat && speciesInfo.habitat !== 'unknown' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '6px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '9999px',
                      padding: '3px 12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#475569',
                      letterSpacing: '0.02em',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ color: '#64748b', fontWeight: 600 }}>
                      {language === 'es' ? 'Hábitat:' : 'Habitat:'}
                    </span>{' '}
                    {HABITAT_LABELS[speciesInfo.habitat]?.[language] || speciesInfo.habitat}
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
                  zIndex: 1,
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
              <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
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
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* 1. Aprende por Nivel */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
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
                        }}
                      >
                        📈 {language === 'es' ? 'Aprende por Nivel' : 'Learned by Level'}
                      </div>
                      {categorizedMoves.levelUp && categorizedMoves.levelUp.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {categorizedMoves.levelUp.map((m, idx) => (
                            <div
                              key={`${m.name}-${m.level}-${idx}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: 'rgba(248, 250, 252, 0.9)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <span
                                style={{
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: '700',
                                  fontSize: '10px',
                                }}
                              >
                                {language === 'es' ? `Nv. ${m.level}` : `Lv. ${m.level}`}
                              </span>
                              <span
                                style={{
                                  fontWeight: '600',
                                  color: '#1e293b',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {m.name.replace(/-/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          {language === 'es' ? 'Ninguno' : 'None'}
                        </span>
                      )}
                    </div>

                    {/* 2. Aprende por MT / MO */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
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
                        }}
                      >
                        💿 {language === 'es' ? 'Aprende por MT / MO' : 'Learned by TM / HM'}
                      </div>
                      {categorizedMoves.machine && categorizedMoves.machine.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {categorizedMoves.machine.map((m, idx) => (
                            <span
                              key={`${m.name}-${idx}`}
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                              }}
                            >
                              {m.name.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          {language === 'es' ? 'Ninguno' : 'None'}
                        </span>
                      )}
                    </div>

                    {/* 3. Movimientos Huevo */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
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
                        }}
                      >
                        🥚 {language === 'es' ? 'Movimientos Huevo' : 'Egg Moves'}
                      </div>
                      {categorizedMoves.egg && categorizedMoves.egg.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {categorizedMoves.egg.map((m, idx) => (
                            <span
                              key={`${m.name}-${idx}`}
                              style={{
                                backgroundColor: '#fdf4ff',
                                color: '#86198f',
                                border: '1px solid #f0abfc',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                              }}
                            >
                              {m.name.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          {language === 'es' ? 'Ninguno' : 'None'}
                        </span>
                      )}
                    </div>
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
                    zIndex: 1,
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
                            {evo.trigger && (
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
                                {evo.trigger}
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

        {/* 3. Mandos Inferiores Pokédex (Detalles Físicos Decorativos) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            padding: '4px 10px 0',
          }}
        >
          {/* Botón circular grande negro a la izquierda */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              border: '2px solid #0f172a',
              boxShadow:
                'inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.5)',
            }}
          />

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

          {/* Cruceta direccional negra (D-pad en cruz) a la derecha */}
          <div
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
            }}
          >
            {/* Barra horizontal */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: 0,
                width: '36px',
                height: '12px',
                backgroundColor: '#1e293b',
                borderRadius: '3px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              }}
            />
            {/* Barra vertical */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '12px',
                width: '12px',
                height: '36px',
                backgroundColor: '#1e293b',
                borderRadius: '3px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              }}
            />
            {/* Hendidura central */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#0f172a',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PokemonModal;
