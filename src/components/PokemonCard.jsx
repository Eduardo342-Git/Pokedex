import { useState, useEffect } from 'react';
import { getPokemonDetails } from '../services/pokemonService';
import { TYPE_COLORS, TYPE_PASTEL_COLORS, TYPE_BORDER_COLORS } from '../utils/pokemonTypes';
import { TYPE_NAMES } from '../utils/translations';
import PokeballWatermark from './PokeballWatermark';

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
    backgroundColor: pastelBg,
    border: `3.5px solid ${borderColor}`,
    borderRadius: '18px',
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
    transition: 'all 0.25s ease',
    transform: isHovered && pokemon ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow:
      isHovered && pokemon
        ? `0 8px 24px ${borderColor}55`
        : `0 4px 14px ${borderColor}30`,
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '3.5px solid #e2e8f0',
          borderRadius: '18px',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px 12px',
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
          fontSize: 'clamp(14px, 1.1vw, 17px)',
          fontWeight: '700',
          color: '#475569',
          letterSpacing: '0.05em',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {formattedId}
      </span>

      {/* Sprite / Imagen del Pokémon: flex: 1, centrado con Pokéball de fondo */}
      <div
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '4px 0',
          minHeight: '120px',
          position: 'relative',
        }}
      >
        <PokeballWatermark
          size="60%"
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
              height: 'clamp(120px, 11vw, 155px)',
              maxHeight: '160px',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.16))',
              imageRendering: 'auto',
              position: 'relative',
              zIndex: 1,
            }}
            loading="lazy"
          />
        ) : (
          <div style={{ height: 'clamp(120px, 11vw, 155px)', position: 'relative', zIndex: 1 }} />
        )}
      </div>

      {/* Nombre: en mayúsculas, semibold estilizado con translate="no" */}
      <h3
        translate="no"
        className="notranslate"
        style={{
          textTransform: 'uppercase',
          fontWeight: '600',
          letterSpacing: '1px',
          fontSize: 'clamp(14px, 1.15vw, 18px)',
          color: '#1e293b',
          margin: '6px 0',
          wordBreak: 'break-word',
          lineHeight: '1.2',
          position: 'relative',
          zIndex: 1,
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
          position: 'relative',
          zIndex: 1,
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
                padding: '5px 14px',
                borderRadius: '14px',
                fontSize: 'clamp(12px, 0.95vw, 14px)',
                fontWeight: '700',
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
