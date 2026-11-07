import { useState, useEffect } from 'react';
import { getPokemonDetails } from '../services/pokemonService';
import { TYPE_COLORS } from '../utils/pokemonTypes';
import { TYPE_NAMES } from '../utils/translations';

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

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 12px',
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
    userSelect: 'none',
  };

  if (loading) {
    return (
      <div style={{ ...cardStyle, cursor: 'default', justifyContent: 'center' }}>
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
      {/* Número (#001): fuente monoespaciada legible, tamaño fluido */}
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 'clamp(12px, 1vw, 15px)',
          fontWeight: 600,
          color: '#64748b',
          letterSpacing: '0.05em',
        }}
      >
        {formattedId}
      </span>

      {/* Sprite / Imagen del Pokémon: flex: 1, centrado y escala fluida */}
      <div
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '4px 0',
          minHeight: '90px',
        }}
      >
        {spriteUrl ? (
          <img
            src={spriteUrl}
            alt={pokemon.name}
            style={{
              height: 'clamp(90px, 9vw, 130px)',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.12))',
              imageRendering: 'auto',
            }}
            loading="lazy"
          />
        ) : (
          <div style={{ height: 'clamp(90px, 9vw, 130px)' }} />
        )}
      </div>

      {/* Nombre: escala fluida, color marino oscuro, negrita 700 con translate="no" */}
      <h3
        translate="no"
        className="notranslate"
        style={{
          margin: '0 0 8px',
          fontSize: 'clamp(15px, 1.2vw, 20px)',
          fontWeight: '700',
          textTransform: 'capitalize',
          color: '#0f172a',
          letterSpacing: '-0.01em',
          wordBreak: 'break-word',
          lineHeight: '1.2',
        }}
      >
        {pokemon.name}
      </h3>

      {/* Badges de Tipos traducidos */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {pokemon.types?.map(({ type }) => {
          const color = TYPE_COLORS[type.name] || { bg: '#64748b', text: '#ffffff' };
          const translatedName = TYPE_NAMES[language]?.[type.name] || type.name;

          return (
            <span
              key={type.name}
              style={{
                backgroundColor: color.bg,
                color: color.text,
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: 'clamp(11px, 0.85vw, 13px)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
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
