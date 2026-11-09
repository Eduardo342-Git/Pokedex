import { useState, useEffect } from 'react';
import { getPokemonDetails } from '../services/pokemonService';
import { TYPE_COLORS, TYPE_PASTEL_COLORS, TYPE_BORDER_COLORS } from '../utils/pokemonTypes';
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
    backgroundColor: pastelBg,
    border: `3px solid ${borderColor}`,
    borderRadius: '16px',
    minHeight: '140px',
    height: 'auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 8px',
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
    overflow: 'visible', /* Permite que el sprite respire */
    userSelect: 'none',
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '3px solid #e2e8f0',
          borderRadius: '16px',
          minHeight: '140px',
          height: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px 8px',
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
      {/* Micro-patrones vectoriales decorativos en las esquinas según el tipo elemental */}
      <TypeDecorations type={primaryType} color={TYPE_BORDER_COLORS[primaryType]} />

      {/* Número (#001): fuente monoespaciada legible */}
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '12.5px',
          fontWeight: '700',
          color: '#475569',
          letterSpacing: '0.05em',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {formattedId}
      </span>

      {/* Sprite / Imagen del Pokémon con Pokéball concéntrica */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          margin: '2px 0',
        }}
      >
        <PokeballWatermark
          size="90px"
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
              width: '85px',
              height: '85px',
              objectFit: 'contain',
              marginTop: '4px',
              filter: 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.16))',
              imageRendering: 'auto',
              position: 'relative',
              zIndex: 1,
            }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '85px', height: '85px', marginTop: '4px', position: 'relative', zIndex: 1 }} />
        )}
      </div>

      {/* Nombre: en mayúsculas, semibold estilizado con translate="no" */}
      <h3
        translate="no"
        className="notranslate"
        style={{
          textTransform: 'uppercase',
          fontWeight: '600',
          letterSpacing: '0.5px',
          fontSize: '13px',
          color: '#1e293b',
          margin: '4px 0',
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
          gap: '4px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          marginTop: '2px',
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
                padding: '3px 8px',
                borderRadius: '10px',
                fontSize: '11px',
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
