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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 10px 14px 10px',
    borderRadius: '18px',
    backgroundColor: pastelBg,
    border: `2px solid ${borderColor}`,
    cursor: pokemon ? 'pointer' : 'default',
    boxSizing: 'border-box',
    minHeight: '195px',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    transform: isHovered && pokemon ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow:
      isHovered && pokemon
        ? `0 8px 24px ${borderColor}55`
        : `0 4px 14px ${borderColor}30`,
    userSelect: 'none',
  };

  if (loading) {
    return (
      <div
        className="pokemon-card"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '18px',
          minHeight: '195px',
          width: '100%',
          padding: '12px 10px 14px 10px',
          boxSizing: 'border-box',
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
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '11px',
          fontWeight: '700',
          color: '#475569',
          letterSpacing: '0.05em',
          zIndex: 1,
        }}
      >
        {formattedId}
      </span>

      {/* Sprite e Ilustración Central con Halo */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100px',
          zIndex: 1,
        }}
      >
        <PokeballWatermark
          size="85px"
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
              maxHeight: '95px',
              maxWidth: '95px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.16))',
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
        className="notranslate"
        style={{
          fontSize: '13px',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: '#1e293b',
          letterSpacing: '0.5px',
          zIndex: 1,
          margin: '4px 0 6px 0',
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
              style={{
                fontSize: '9.5px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '8px',
                textTransform: 'uppercase',
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
