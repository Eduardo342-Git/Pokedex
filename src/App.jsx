import { useState, useEffect, useRef, useMemo } from 'react';
import { getPokemonList, getPokemonDetails, getAllPokemonNames } from './services/pokemonService';
import PokemonCard from './components/PokemonCard';
import PokemonModal from './components/PokemonModal';
import { UI_TRANSLATIONS } from './utils/translations';
import { REGIONS } from './utils/regions';

function App() {
  const gridContainerRef = useRef(null);

  const [language, setLanguage] = useState('es');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const ITEMS_PER_PAGE = 12;
  const [limit] = useState(ITEMS_PER_PAGE);
  const [pokemonList, setPokemonList] = useState([]);
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Catálogo completo para búsqueda instantánea en memoria
  const [allPokemons, setAllPokemons] = useState([]);

  // Cargar catálogo global en segundo plano al montar la aplicación
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      const data = await getAllPokemonNames();
      if (isMounted && Array.isArray(data)) {
        setAllPokemons(data);
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentRegion = useMemo(() => {
    return REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0];
  }, [selectedRegion]);

  const totalPages = Math.ceil(currentRegion.limit / limit) || 1;

  // Carga inicial y por paginación (reactiva a page, limit y región seleccionada)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const actualOffset = currentRegion.offset + (page - 1) * limit;
        const remainingInRegion = currentRegion.limit - (page - 1) * limit;
        const fetchLimit = Math.max(0, Math.min(limit, remainingInRegion));

        if (fetchLimit <= 0) {
          if (isMounted) {
            setPokemonList([]);
          }
          return;
        }

        const data = await getPokemonList(fetchLimit, actualOffset);
        if (isMounted) {
          setPokemonList(data.results || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [page, limit, currentRegion]);

  const handleRegionChange = (newRegionId) => {
    setSelectedRegion(newRegionId);
    setPage(1);
    setInputPage(1);
  };

  // Búsqueda por ID exacta e inteligente / coincidencia por texto en nombres
  const rawQuery = search.trim().toLowerCase();
  const cleanQuery = rawQuery.replace('#', '');
  const isSearchActive = rawQuery !== '';

  // Si el usuario ingresó números (ej. '#001', '001', '25', '#4'):
  const isNumeric = /^\d+$/.test(cleanQuery);
  const searchId = isNumeric ? parseInt(cleanQuery, 10) : null;

  const matchedPokemons = useMemo(() => {
    if (!isSearchActive) return [];
    return allPokemons.filter((p) => {
      const urlParts = p.url ? p.url.split('/').filter(Boolean) : [];
      const pId = parseInt(urlParts[urlParts.length - 1], 10);

      // 1. Si busca por número o almohadilla (#001, 1, 25): coincidencia numérica EXACTA
      if (isNumeric) {
        return pId === searchId;
      }

      // 2. Si busca por texto (ej. 'char', 'pika'): coincidencia en el nombre
      return p.name.toLowerCase().includes(rawQuery);
    });
  }, [allPokemons, isSearchActive, isNumeric, searchId, rawQuery]);

  const goToPage = (newPage) => {
    const valid = Math.max(1, Math.min(newPage, totalPages));
    setPage(valid);
    setInputPage(valid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageCommit = () => {
    const parsed = parseInt(inputPage, 10);
    if (isNaN(parsed) || parsed < 1) {
      goToPage(1);
    } else if (parsed > totalPages) {
      goToPage(totalPages);
    } else {
      goToPage(parsed);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleRandomPokemon = async () => {
    try {
      setLoading(true);
      // Rango oficial acotado a la región seleccionada
      const minId = currentRegion.offset + 1;
      const maxId = currentRegion.offset + currentRegion.limit;
      const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;

      // Obtener los detalles del Pokémon aleatorio
      const randomData = await getPokemonDetails(randomId);

      // Abrir directamente su modal de Pokédex
      setSelectedPokemon(randomData);
    } catch (err) {
      setError('Error al invocar Pokémon aleatorio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(145deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Pokéball Holográfica de Fondo (Watermark) */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '50%',
          top: '55%',
          transform: 'translate(-50%, -50%) rotate(-15deg)',
          width: '600px',
          height: '600px',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.16,
        }}
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
      >
        <circle cx="50" cy="50" r="46" />
        <line x1="4" y1="50" x2="35" y2="50" />
        <line x1="65" y1="50" x2="96" y2="50" />
        <circle cx="50" cy="50" r="15" />
        <circle cx="50" cy="50" r="7" fill="#ffffff" />
      </svg>

      {/* 1. Barra Superior (Estuche Superior Pokédex Kalos Holo-Caster) */}
      <header
        style={{
          width: '100%',
          backgroundColor: '#e11d48',
          padding: '14px 24px',
          boxShadow: '0 4px 20px rgba(225, 29, 72, 0.35)',
          position: 'relative',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Sensor frontal / Logo anclado estrictamente a la izquierda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              border: '2px solid #ffffff',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.9)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: '#ffffff',
              fontWeight: 900,
              fontSize: 'clamp(1.2rem, 1.8vw, 1.5rem)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            POKÉDEX
          </span>
        </div>

        {/* Arco / Semicírculo Pokéball Phone característico */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '-26px',
            width: '60px',
            height: '30px',
            backgroundColor: '#1e293b',
            borderRadius: '0 0 30px 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
            borderBottom: '3px solid #e11d48',
            borderLeft: '3px solid #e11d48',
            borderRight: '3px solid #e11d48',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              boxShadow: '0 0 6px rgba(56, 189, 248, 0.9)',
              border: '2px solid #ffffff',
            }}
          />
        </div>

        {/* Lado derecho: Conmutador de Idioma y Badge de Conteo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Conmutador de Idioma */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '20px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <button
              type="button"
              onClick={() => setLanguage('es')}
              style={{
                backgroundColor: language === 'es' ? '#ffffff' : 'transparent',
                color: language === 'es' ? '#dc2626' : '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                backgroundColor: language === 'en' ? '#ffffff' : 'transparent',
                color: language === 'en' ? '#dc2626' : '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              EN
            </button>
          </div>

          {/* Insignia de conteo de Pokémon */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            {isSearchActive
              ? `${matchedPokemons.length} ${language === 'es' ? 'resultado' : 'result'}${matchedPokemons.length === 1 ? '' : 's'}`
              : `${currentRegion.limit} ${UI_TRANSLATIONS[language].totalPokemon}`}
          </div>
        </div>
      </header>

      {/* 2. Área Central de Contenido */}
      <main
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          paddingTop: '10px',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Barra de Búsqueda Translúcida, Botón Aleatorio y Selector de Región */}
        <div
          style={{
            width: '100%',
            maxWidth: '860px',
            padding: '0 20px',
            boxSizing: 'border-box',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              flex: '1 1 300px',
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.85)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.12)',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'box-shadow 0.2s',
            }}
          >
            <span style={{ fontSize: '1.1rem', color: '#0284c7' }}>🔍</span>
            <input
              type="text"
              placeholder={UI_TRANSLATIONS[language].searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.95rem',
                color: '#0f172a',
                padding: '8px 0',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Limpiar búsqueda"
                style={{
                  border: 'none',
                  backgroundColor: 'rgba(100, 116, 139, 0.2)',
                  color: '#334155',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.2)')
                }
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleRandomPokemon}
            title={language === 'es' ? 'Obtener Pokémon aleatorio' : 'Get random Pokémon'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#e11d48',
              color: '#ffffff',
              border: 'none',
              borderRadius: '30px',
              padding: '10px 18px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>🎲</span>
            <span>{UI_TRANSLATIONS[language].randomBtn}</span>
          </button>

          {/* Selector de Región */}
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {REGIONS.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {language === 'es' ? reg.name : reg.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Contenedor de la Cuadrícula */}
        <div
          ref={gridContainerRef}
          className="pro-grid"
          style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Estado de Carga Inicial */}
          {loading && !isSearchActive && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '30px 20px',
                color: '#1e3a8a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '4px solid rgba(2, 132, 199, 0.2)',
                  borderTopColor: '#0284c7',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '12px',
                }}
              />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                {UI_TRANSLATIONS[language].loadingCatalog}
              </p>
            </div>
          )}

          {/* Error de Carga */}
          {error && !loading && !isSearchActive && (
            <div
              style={{
                gridColumn: '1 / -1',
                backgroundColor: 'rgba(254, 226, 226, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #f87171',
                borderRadius: '16px',
                padding: '16px 24px',
                color: '#991b1b',
                textAlign: 'center',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>Error: {error}</p>
            </div>
          )}

          {/* Búsqueda Global: 0 Resultados */}
          {isSearchActive && matchedPokemons.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                gridRow: '1 / -1',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '18px',
                padding: '24px 28px',
                color: '#334155',
                textAlign: 'center',
                maxWidth: '520px',
                margin: 'auto',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.15)',
              }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>
                📡
              </span>
              <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 12px', color: '#0f172a' }}>
                {UI_TRANSLATIONS[language].noResults}
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {UI_TRANSLATIONS[language].resetCatalog}
              </button>
            </div>
          )}

          {/* Modo Búsqueda: Renderiza las tarjetas directamente en la cuadrícula fija */}
          {isSearchActive &&
            matchedPokemons.map((pokemon) => (
              <PokemonCard
                key={pokemon.name}
                pokemon={pokemon}
                pokemonName={pokemon.name}
                language={language}
                onSelect={(p) => setSelectedPokemon(p)}
                onClick={(p) => setSelectedPokemon(p)}
              />
            ))}

          {/* Modo Catálogo Normal */}
          {!isSearchActive &&
            !loading &&
            !error &&
            pokemonList.map((pokemon) => (
              <PokemonCard
                key={pokemon.name}
                pokemon={pokemon}
                pokemonName={pokemon.name}
                language={language}
                onSelect={(p) => setSelectedPokemon(p)}
                onClick={(p) => setSelectedPokemon(p)}
              />
            ))}
        </div>
      </main>

      {/* 3. Barra Inferior de Navegación (Panel Interactivo Completo) - Solo en modo catálogo normal */}
      {!isSearchActive && (
        <footer
          style={{
            width: '100%',
            backgroundColor: '#e11d48',
            borderTop: '3px solid #be123c',
            boxShadow: '0 -4px 20px rgba(225, 29, 72, 0.25)',
            padding: '10px 24px',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 40,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {/* Botón « Inicio */}
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={page === 1 || loading}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                padding: '7px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
                opacity: page === 1 || loading ? 0.45 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (page !== 1 && !loading) e.currentTarget.style.backgroundColor = '#0369a1';
              }}
              onMouseLeave={(e) => {
                if (page !== 1 && !loading) e.currentTarget.style.backgroundColor = '#0284c7';
              }}
            >
              {UI_TRANSLATIONS[language].first}
            </button>

            {/* Botón ◀ Anterior */}
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                padding: '7px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
                opacity: page === 1 || loading ? 0.45 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (page !== 1 && !loading) e.currentTarget.style.backgroundColor = '#0369a1';
              }}
              onMouseLeave={(e) => {
                if (page !== 1 && !loading) e.currentTarget.style.backgroundColor = '#0284c7';
              }}
            >
              {UI_TRANSLATIONS[language].prev}
            </button>

            {/* Cápsula interactiva Pág. [input] / totalPages */}
            <div
              style={{
                backgroundColor: '#1e293b',
                backdropFilter: 'blur(6px)',
                padding: '5px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <span>{UI_TRANSLATIONS[language].page}</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePageCommit()}
                onBlur={handlePageCommit}
                className="page-input"
                style={{
                  width: '48px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  padding: '2px 4px',
                  outline: 'none',
                  margin: '0 4px',
                  colorScheme: 'dark',
                }}
              />
              <span>/ {totalPages}</span>
            </div>

            {/* Botón Siguiente ▶ */}
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || loading}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                padding: '7px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: page >= totalPages || loading ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages || loading ? 0.45 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (page < totalPages && !loading) e.currentTarget.style.backgroundColor = '#0369a1';
              }}
              onMouseLeave={(e) => {
                if (page < totalPages && !loading) e.currentTarget.style.backgroundColor = '#0284c7';
              }}
            >
              {UI_TRANSLATIONS[language].next}
            </button>

            {/* Botón Final » */}
            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              disabled={page >= totalPages || loading}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                padding: '7px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: page >= totalPages || loading ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages || loading ? 0.45 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (page < totalPages && !loading) e.currentTarget.style.backgroundColor = '#0369a1';
              }}
              onMouseLeave={(e) => {
                if (page < totalPages && !loading) e.currentTarget.style.backgroundColor = '#0284c7';
              }}
            >
              {UI_TRANSLATIONS[language].last}
            </button>
          </div>
        </footer>
      )}

      {/* Modal Holográfico / Pokédex Handheld */}
      {selectedPokemon && (
        <PokemonModal
          pokemon={selectedPokemon}
          language={language}
          onClose={() => setSelectedPokemon(null)}
          onSelectPokemon={setSelectedPokemon}
        />
      )}
    </div>
  );
}

export default App;
