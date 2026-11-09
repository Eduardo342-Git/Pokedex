import { useState, useEffect, useRef, useMemo } from 'react';
import {
  getPokemonDetails,
  getPokemonTypeRelations,
  getPokemonEvolutions,
  getPokemonSpeciesData,
  getAbilityName,
  getPokemonMovesCategorized,
} from '../services/pokemonService';
import { TYPE_COLORS, TYPE_PASTEL_COLORS, TYPE_BORDER_COLORS } from '../utils/pokemonTypes';
import { UI_TRANSLATIONS, TYPE_NAMES } from '../utils/translations';

const STAT_LABELS = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
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
  const [typeRelations, setTypeRelations] = useState({
    strongAgainst: [],
    weakAgainst: [],
    notEffectiveAgainst: [],
  });
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [speciesInfo, setSpeciesInfo] = useState(null);
  const [isShiny, setIsShiny] = useState(false);
  const [loadingCombatData, setLoadingCombatData] = useState(false);
  const [translatedAbilities, setTranslatedAbilities] = useState([]);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'moves'
  const prevPokemonNameRef = useRef(currentPokemon?.name);

  // Procesar movimientos categorizados de forma memoizada al cambiar currentPokemon
  const categorizedMoves = useMemo(() => {
    if (currentPokemon && currentPokemon.moves) {
      return getPokemonMovesCategorized(currentPokemon.moves);
    }
    return { levelUp: [], machine: [], egg: [] };
  }, [currentPokemon]);

  // Sincronizar si cambia la prop pokemon externamente sin efecto en cascada
  if (pokemon !== prevPokemonProp) {
    setPrevPokemonProp(pokemon);
    setCurrentPokemon(pokemon);
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

  // Carga reactiva de especie, relaciones y evolución al cambiar currentPokemon o language
  useEffect(() => {
    let isMounted = true;
    if (!currentPokemon) return;

    const loadData = async () => {
      try {
        if (prevPokemonNameRef.current !== currentPokemon.name) {
          prevPokemonNameRef.current = currentPokemon.name;
          if (isMounted) setIsShiny(false);
        }
        setLoadingCombatData(true);
        const types = currentPokemon.types?.map((t) => t.type.name) || [];
        const [relations, evolutions, species] = await Promise.all([
          getPokemonTypeRelations(types),
          getPokemonEvolutions(currentPokemon.name),
          getPokemonSpeciesData(currentPokemon.name, language),
        ]);

        if (isMounted) {
          setTypeRelations(
            relations || { strongAgainst: [], weakAgainst: [], notEffectiveAgainst: [] }
          );
          setEvolutionChain(evolutions || []);
          setSpeciesInfo(species || { description: '', genus: '' });
        }
      } catch (error) {
        console.error('Error cargando datos de Pokémon:', error);
      } finally {
        if (isMounted) {
          setLoadingCombatData(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentPokemon, language]);

  // Carga reactiva de nombres de habilidades traducidas al cambiar currentPokemon o language
  useEffect(() => {
    let isMounted = true;
    if (!currentPokemon) return;

    const loadAbilities = async () => {
      try {
        const translated = await Promise.all(
          (currentPokemon.abilities || []).map(async (item) => {
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
  }, [currentPokemon, language]);

  if (!currentPokemon) return null;

  // Lógica de navegación de evoluciones
  const currentIndex = evolutionChain.indexOf(currentPokemon.name.toLowerCase());
  const preEvolutionName = currentIndex > 0 ? evolutionChain[currentIndex - 1] : null;
  const nextEvolutionName =
    currentIndex !== -1 && currentIndex < evolutionChain.length - 1
      ? evolutionChain[currentIndex + 1]
      : null;

  // Función de cambio rápido de evolución
  const handleNavigateEvolution = async (targetName) => {
    try {
      setLoadingCombatData(true);
      const updatedPokemon = await getPokemonDetails(targetName);
      setCurrentPokemon(updatedPokemon);
      setIsShiny(false);
    } catch (error) {
      console.error('Error al navegar evolución:', error);
    } finally {
      setLoadingCombatData(false);
    }
  };

  const playCry = () => {
    const audioUrl = currentPokemon.cries?.latest || currentPokemon.cries?.legacy;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = 0.6;
      audio.play().catch((e) => console.warn('Audio no disponible', e));
    }
  };

  const hasCry = Boolean(currentPokemon.cries?.latest || currentPokemon.cries?.legacy);
  const formattedId = `#${String(currentPokemon.id).padStart(3, '0')}`;

  // Selección reactiva del sprite según isShiny
  const spriteUrl = isShiny
    ? currentPokemon.sprites?.other?.['official-artwork']?.front_shiny ||
      currentPokemon.sprites?.front_shiny
    : currentPokemon.sprites?.other?.['official-artwork']?.front_default ||
      currentPokemon.sprites?.front_default;

  const totalStats =
    currentPokemon.stats?.reduce((acc, curr) => acc + curr.base_stat, 0) || 0;

  const primaryType = currentPokemon.types?.[0]?.type?.name || 'normal';
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

            {/* Pantalla interior LCD con fondo pastel dinámico y ajuste sin scroll */}
            <div
              style={{
                backgroundColor: pastelBg,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease',
                border: `2px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '10px 14px',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                maxHeight: '62vh',
              }}
            >
              {/* Marca de agua Pokéball decorativa */}
              <div
                style={{
                  position: 'absolute',
                  right: '-30px',
                  bottom: '-30px',
                  width: '200px',
                  height: '200px',
                  opacity: 0.08,
                  pointerEvents: 'none',
                  backgroundImage: `radial-gradient(circle, #000 20%, transparent 21%), radial-gradient(circle, transparent 35%, #000 36%, #000 44%, transparent 45%)`,
                  backgroundSize: '100% 100%',
                }}
              />
              {/* Encabezado: #ID y Nombre */}
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <span
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#64748b',
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
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {currentPokemon.name}
                </h2>
              </div>

              {/* Selector Shiny ✨ tipo píldora (encima del sprite) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '6px',
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
                    padding: '2px 10px',
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

              {/* Sprite Oficial centrado con altura compacta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: isShiny
                      ? 'radial-gradient(circle, #fef08a 0%, #fef9c3 60%, transparent 100%)'
                      : 'radial-gradient(circle, #e2e8f0 0%, #f1f5f9 70%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isShiny ? '2px solid #eab308' : '1px solid #cbd5e1',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {spriteUrl ? (
                    <img
                      src={spriteUrl}
                      alt={`${currentPokemon.name}${isShiny ? ' shiny' : ''}`}
                      style={{
                        maxHeight: '115px',
                        height: '115px',
                        width: 'auto',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: isShiny
                          ? 'drop-shadow(0 4px 8px rgba(234, 179, 8, 0.45))'
                          : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))',
                        transition: 'filter 0.3s ease',
                      }}
                    />
                  ) : (
                    <span style={{ color: '#94a3b8' }}>{UI_TRANSLATIONS[language].noImage}</span>
                  )}
                </div>
              </div>

              {/* Badges de Tipos Oficiales */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '6px',
                }}
              >
                {currentPokemon.types?.map(({ type }) => {
                  const color = TYPE_COLORS[type.name] || { bg: '#64748b', text: '#ffffff' };
                  const translatedType = TYPE_NAMES[language]?.[type.name] || type.name;
                  return (
                    <span
                      key={type.name}
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
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

              {/* Botón de Audio Nativo */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
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
              </div>

              {/* Ficha Técnica: Género/Categoría */}
              {speciesInfo?.genus && (
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: '#64748b',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {speciesInfo.genus}
                  </span>
                </div>
              )}

              {/* Medidas Físicas (Grid de 2 columnas compacto) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    📏 {UI_TRANSLATIONS[language].height}
                  </span>
                  <p
                    style={{
                      margin: '1px 0 0',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      color: '#0f172a',
                    }}
                  >
                    {(currentPokemon.height / 10).toFixed(1)} m
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    ⚖️ {UI_TRANSLATIONS[language].weight}
                  </span>
                  <p
                    style={{
                      margin: '1px 0 0',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      color: '#0f172a',
                    }}
                  >
                    {(currentPokemon.weight / 10).toFixed(1)} kg
                  </p>
                </div>
              </div>

              {/* Caja de Texto de la Pokédex (Lore) */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    lineHeight: '1.35',
                    color: '#334155',
                    fontStyle: 'italic',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
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
                border: `2px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '10px 14px',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                maxHeight: '62vh',
              }}
            >
              {/* Marca de agua Pokéball decorativa */}
              <div
                style={{
                  position: 'absolute',
                  right: '-30px',
                  bottom: '-30px',
                  width: '200px',
                  height: '200px',
                  opacity: 0.08,
                  pointerEvents: 'none',
                  backgroundImage: `radial-gradient(circle, #000 20%, transparent 21%), radial-gradient(circle, transparent 35%, #000 36%, #000 44%, transparent 45%)`,
                  backgroundSize: '100% 100%',
                }}
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
                          : currentPokemon.abilities?.map(({ ability, is_hidden }, index) => (
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

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {currentPokemon.stats?.map((s) => {
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

              {/* Botonera de Evoluciones al pie */}
              {(preEvolutionName || nextEvolutionName) && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginTop: '8px',
                  }}
                >
                  {preEvolutionName && (
                    <button
                      type="button"
                      onClick={() => handleNavigateEvolution(preEvolutionName)}
                      disabled={loadingCombatData}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#334155',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: loadingCombatData ? 'not-allowed' : 'pointer',
                        opacity: loadingCombatData ? 0.6 : 1,
                        textTransform: 'capitalize',
                        transition: 'background-color 0.2s',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingCombatData) e.currentTarget.style.backgroundColor = '#1e293b';
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingCombatData) e.currentTarget.style.backgroundColor = '#334155';
                      }}
                    >
                      ◀ <span translate="no" className="notranslate">{preEvolutionName}</span>
                    </button>
                  )}
                  {nextEvolutionName && (
                    <button
                      type="button"
                      onClick={() => handleNavigateEvolution(nextEvolutionName)}
                      disabled={loadingCombatData}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#e11d48',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: loadingCombatData ? 'not-allowed' : 'pointer',
                        opacity: loadingCombatData ? 0.6 : 1,
                        textTransform: 'capitalize',
                        transition: 'background-color 0.2s',
                        boxShadow: '0 2px 4px rgba(225, 29, 72, 0.25)',
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingCombatData) e.currentTarget.style.backgroundColor = '#be123c';
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingCombatData) e.currentTarget.style.backgroundColor = '#e11d48';
                      }}
                    >
                      <span translate="no" className="notranslate">{nextEvolutionName}</span> ▶
                    </button>
                  )}
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
