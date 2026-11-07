import { useState, useEffect, useRef } from 'react';
import { getPokemonList, getPokemonDetails } from './services/pokemonService';
import PokemonCard from './components/PokemonCard';
import PokemonModal from './components/PokemonModal';

function App() {
  const gridContainerRef = useRef(null);

  const [limit, setLimit] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 21 : 12
  );
  const [pokemonList, setPokemonList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(page);
  const [search, setSearch] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para búsqueda global
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Ajuste del límite de tarjetas por pantalla (21 en escritorio: 7 cols x 3 rows)
  const updateLimitFromContainer = () => {
    if (typeof window === 'undefined') return;

    if (window.innerWidth < 768) {
      setLimit(12);
      return;
    }

    if (window.innerWidth < 1024) {
      setLimit(15);
      return;
    }

    // Escritorio (>= 1024): 7 columnas x 3 filas = 21 Pokémon exactos
    setLimit(21);
  };

  // Observador de tamaño sobre el contenedor real
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      updateLimitFromContainer();
    });

    observer.observe(container);
    updateLimitFromContainer();

    return () => observer.disconnect();
  }, []);

  // Sincronizar inputPage cada vez que page cambie
  useEffect(() => {
    setInputPage(page);
  }, [page]);

  // Carga inicial y por paginación (reactiva a page y limit)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * limit;
        const data = await getPokemonList(limit, offset);
        setPokemonList(data.results || []);
        setTotalCount(data.count || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [page, limit]);

  // Asegurar que page no quede fuera de rango tras recalcular limit
  useEffect(() => {
    const maxPages = Math.ceil(totalCount / limit) || 1;
    if (page > maxPages) {
      setPage(maxPages);
    }
  }, [limit, totalCount, page]);

  // Búsqueda global con Debounce
  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      setSearchNotFound(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchNotFound(false);

    const timer = setTimeout(async () => {
      try {
        const data = await getPokemonDetails(query);
        if (data && data.name) {
          setSearchResults([{ name: data.name }]);
          setSearchNotFound(false);
        } else {
          setSearchResults([]);
          setSearchNotFound(true);
        }
      } catch {
        setSearchResults([]);
        setSearchNotFound(true);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const isSearchActive = search.trim() !== '';
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePageCommit = () => {
    const parsed = parseInt(inputPage, 10);
    if (isNaN(parsed) || parsed < 1) {
      setPage(1);
      setInputPage(1);
    } else if (parsed > totalPages) {
      setPage(totalPages);
      setInputPage(totalPages);
    } else {
      setPage(parsed);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchResults([]);
    setSearchNotFound(false);
    setIsSearching(false);
  };

  const handleRandomPokemon = async () => {
    try {
      setLoading(true);
      // Total canónico de Pokémon en la PokéAPI (1025) o totalCount si ya está cargado
      const maxId = totalCount > 0 ? Math.min(totalCount, 1025) : 1025;
      const randomId = Math.floor(Math.random() * maxId) + 1;

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
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Sensor frontal / Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                border: '2px solid #ffffff',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.9)',
              }}
            />
            <span
              style={{
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.25rem',
                letterSpacing: '3px',
                textTransform: 'uppercase',
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
            }}
          >
            {isSearchActive
              ? 'Búsqueda Global'
              : totalCount > 0
              ? `${totalCount} Pokémon`
              : 'Holo-Net'}
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
        {/* Barra de Búsqueda Translúcida y Botón Aleatorio */}
        <div
          style={{
            width: '100%',
            maxWidth: '680px',
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
              placeholder="Buscar Pokemon por nombre"
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
            title="Obtener Pokémon aleatorio"
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
            <span>Aleatorio</span>
          </button>
        </div>

        {/* Contenedor de la Cuadrícula: 7 columnas x 3 filas = 21 Pokémon */}
        <div
          ref={gridContainerRef}
          className="pokemon-grid-container"
          style={{
            width: '100%',
            flex: 1,
            boxSizing: 'border-box',
            padding: '12px 32px',
            display: search.trim() ? 'flex' : 'grid',
            justifyContent: search.trim() ? 'center' : 'stretch',
            alignItems: search.trim() ? 'flex-start' : 'stretch',
            gridTemplateColumns: search.trim() ? 'none' : 'repeat(7, 1fr)',
            gridTemplateRows: search.trim() ? 'none' : 'repeat(3, 1fr)',
            gap: '16px',
            overflow: 'hidden',
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
                Sintonizando base de datos holográfica...
              </p>
            </div>
          )}

          {/* Estado de Carga en Búsqueda Global */}
          {isSearching && (
            <div
              style={{
                textAlign: 'center',
                padding: '30px 20px',
                color: '#0284c7',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '4px solid rgba(2, 132, 199, 0.25)',
                  borderTopColor: '#e11d48',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '10px',
                }}
              />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                Consultando la red nacional PokéAPI...
              </p>
            </div>
          )}

          {/* Error de Paginación */}
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

          {/* Resultado No Encontrado en Búsqueda */}
          {isSearchActive && searchNotFound && !isSearching && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '18px',
                padding: '24px 20px',
                color: '#334155',
                textAlign: 'center',
                maxWidth: '520px',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.15)',
              }}
            >
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '6px' }}>
                📡
              </span>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 10px', color: '#0f172a' }}>
                No se encontró ningún Pokémon con ese nombre en la base de datos nacional.
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '6px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                Restablecer catálogo
              </button>
            </div>
          )}

          {/* Cuadrícula de Pokémon: Modo Catálogo Normal */}
          {!isSearchActive && !loading && !error && (
            pokemonList.map((pokemon) => (
              <PokemonCard
                key={pokemon.name}
                pokemonName={pokemon.name}
                onSelect={(p) => setSelectedPokemon(p)}
              />
            ))
          )}

          {/* Búsqueda Global: Tarjeta Centrada */}
          {isSearchActive && !isSearching && searchResults.length > 0 && (
            <div style={{ width: '100%', maxWidth: '220px', paddingTop: '10px' }}>
              {searchResults.map((pokemon) => (
                <PokemonCard
                  key={pokemon.name}
                  pokemonName={pokemon.name}
                  onSelect={(p) => setSelectedPokemon(p)}
                />
              ))}
            </div>
          )}
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
              onClick={() => {
                setPage(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
              « Inicio
            </button>

            {/* Botón ◀ Anterior */}
            <button
              type="button"
              onClick={() => {
                setPage((prev) => Math.max(prev - 1, 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
              ◀ Anterior
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
              <span>Pág.</span>
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
              onClick={() => {
                setPage((prev) => Math.min(prev + 1, totalPages));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
              Siguiente ▶
            </button>

            {/* Botón Final » */}
            <button
              type="button"
              onClick={() => {
                setPage(totalPages);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
              Final »
            </button>
          </div>
        </footer>
      )}

      {/* Modal Holográfico / Pokédex Handheld */}
      {selectedPokemon && (
        <PokemonModal
          pokemon={selectedPokemon}
          onClose={() => setSelectedPokemon(null)}
        />
      )}
    </div>
  );
}

export default App;
