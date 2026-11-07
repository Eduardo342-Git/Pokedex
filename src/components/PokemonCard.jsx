import { useState, useEffect } from 'react';
import { getPokemonDetails } from '../services/pokemonService';
import { TYPE_COLORS } from '../utils/pokemonTypes';

function PokemonCard({ pokemonName, onSelect }) {
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

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '14px 10px',
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
    cursor: pokemon ? 'pointer' : 'default',
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    transform:
      isHovered && pokemon
        ? 'translateY(-4px) scale(1.02)'
        : 'translateY(0) scale(1)',
    boxShadow:
      isHovered && pokemon
        ? '0 16px 25px -4px rgba(59, 130, 246, 0.3), 0 6px 8px -4px rgba(59, 130, 246, 0.2)'
        : '0 6px 18px -3px rgba(59, 130, 246, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none',
  };

  if (loading) {
    return (
      <div style={{ ...cardStyle, cursor: 'default', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>
          Sintonizando...
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
      {/* ID Monoespaciado */}
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#64748b',
          letterSpacing: '0.05em',
        }}
      >
        {formattedId}
      </span>

      {/* Imagen del Pokémon */}
      <div
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '2px 0',
          minHeight: '70px',
        }}
      >
        {spriteUrl ? (
          <img
            src={spriteUrl}
            alt={pokemon.name}
            style={{
              maxHeight: '100px',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
            }}
            loading="lazy"
          />
        ) : (
          <div style={{ height: '70px' }} />
        )}
      </div>

      {/* Nombre */}
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: '0.9rem',
          fontWeight: 600,
          textTransform: 'capitalize',
          color: '#0f172a',
          letterSpacing: '-0.01em',
          wordBreak: 'break-word',
          lineHeight: '1.2',
        }}
      >
        {pokemon.name}
      </h3>

      {/* Badges de Tipos tipo Píldora */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {pokemon.types?.map(({ type }) => {
          const color = TYPE_COLORS[type.name] || { bg: '#64748b', text: '#ffffff' };
          return (
            <span
              key={type.name}
              style={{
                backgroundColor: color.bg,
                color: color.text,
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              {type.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default PokemonCard;
