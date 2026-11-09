import { useState, useEffect } from 'react';
import { getPokemonDetails } from '../services/pokemonService';
import { TYPE_PASTEL_COLORS, TYPE_BORDER_COLORS } from '../utils/pokemonTypes';
import { TYPE_NAMES } from '../utils/translations';
import PokeballWatermark from './PokeballWatermark';
import TypeDecorations from './TypeDecorations';

function PokemonCard({ pokemonName, onSelect, language = 'es' }) {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDetails = async () => {
      try {
        setLoading(true);
        const data = await getPokemonDetails(pokemonName);
        if (isMounted) setPokemon(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [pokemonName]);

  const primaryType = pokemon?.types?.[0]?.type?.name || 'normal';
  const borderColor = TYPE_BORDER_COLORS[primaryType] || '#cbd5e1';
  const pastelBg = TYPE_PASTEL_COLORS[primaryType] || '#f8fafc';

  const cardStyle = {
    position: 'relative',
    backgroundColor: pastelBg,
    border: `2px solid ${borderColor}`,
    cursor: pokemon ? 'pointer' : 'default',
    boxSizing: 'border-box',
    overflow: 'hidden',
    userSelect: 'none',
    boxShadow:
      isHovered && pokemon
        ? `0 8px 24px ${borderColor}55`
        : `0 4px 14px ${borderColor}30`,
  };

  if (loading) {
    return (
      <div
        className="pokemon-card"
        style={{
          position: 'relative',
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          justifyContent: 'center',
          cursor: 'default',
        }}
      >
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>
          {language === 'es' ? 'Sintonizando...' : 'Tuning in...'}
        </p>
      </div>
    );
  }

  if (!pokemon) return null;

  const formattedId = `#${String(pokemon.id).padStart(3, '0')}`;
  const spriteUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default;

  return (
    <div
      role="button"
      tabIndex={0}
      className="pokemon-card"
      onClick={() => pokemon && onSelect && onSelect(pokemon)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && pokemon && onSelect) {
          e.preventDefault();
          onSelect(pokemon);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={cardStyle}
    >
      {/* Micro-patrones vectoriales decorativos en las esquinas según el tipo elemental */}
      <TypeDecorations type={primaryType} color={TYPE_BORDER_COLORS[primaryType]} />

      {/* Encabezado: #ID */}
      <span
        className="card-id"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          color: '#475569',
          zIndex: 1,
        }}
      >
        {formattedId}
      </span>

      {/* Sprite e Ilustración Central con Halo */}
      <div
        className="sprite-wrapper"
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        <PokeballWatermark
          size="115px"
          opacity={isHovered ? 0.38 : 0.30}
          rotate={isHovered ? 25 : 0}
          scale={isHovered ? 1.05 : 1}
          color={TYPE_BORDER_COLORS[primaryType] || '#94a3b8'}
        />
        {spriteUrl ? (
          <img
            src={spriteUrl}
            alt={pokemon.name}
            style={{
              position: 'relative',
              zIndex: 1,
            }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '85px', height: '85px', position: 'relative', zIndex: 1 }} />
        )}
      </div>

      {/* Nombre del Pokémon */}
      <span
        translate="no"
        className="notranslate card-name"
        style={{
          color: '#1e293b',
          zIndex: 1,
          wordBreak: 'break-word',
          textAlign: 'center',
          lineHeight: '1.2',
        }}
      >
        {pokemon.name}
      </span>

      {/* Badges de Tipos: Integrados en el flujo normal (NUNCA en absolute fuera del cuadro) */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          zIndex: 1,
          width: '100%',
        }}
      >
        {pokemon.types?.map(({ type }) => {
          const translatedName = TYPE_NAMES[language]?.[type.name] || type.name;

          return (
            <span
              key={type.name}
              className="type-badge"
              style={{
                color: '#ffffff',
                backgroundColor: TYPE_BORDER_COLORS[type.name] || '#64748b',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              {translatedName}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default PokemonCard;
