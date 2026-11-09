import { useState, useEffect } from 'react';
import { getPokemonDetails } from '../services/pokemonService';
import { TYPE_PASTEL_COLORS, TYPE_BORDER_COLORS } from '../utils/pokemonTypes';
import { TYPE_NAMES } from '../utils/translations';
import TypeDecorations from './TypeDecorations';

const PokemonCard = ({ pokemon, pokemonName, onClick, onSelect, language = 'es' }) => {
  const hasFullData = Boolean(pokemon?.types && pokemon?.sprites);
  const [details, setDetails] = useState(hasFullData ? pokemon : null);
  const [loading, setLoading] = useState(!hasFullData);

  useEffect(() => {
    if (hasFullData) {
      return;
    }

    const nameOrId = pokemonName || pokemon?.name || pokemon?.id;
    if (!nameOrId) return;

    let isMounted = true;
    const loadDetails = async () => {
      try {
        setLoading(true);
        const data = await getPokemonDetails(nameOrId);
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [pokemon, pokemonName, hasFullData]);

  const activePokemon = hasFullData ? pokemon : details;

  if (loading || !activePokemon) {
    return (
      <div
        className="pokemon-card"
        style={{
          width: '100%',
          minHeight: '230px',
          height: 'auto',
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '20px',
          padding: '14px 12px 16px 12px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default',
        }}
      >
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: 500 }}>
          {language === 'es' ? 'Sintonizando...' : 'Tuning in...'}
        </p>
      </div>
    );
  }

  const primaryType = activePokemon.types?.[0]?.type?.name || 'normal';
  const pastelBg = TYPE_PASTEL_COLORS?.[primaryType] || '#f1f5f9';
  const borderColor = TYPE_BORDER_COLORS?.[primaryType] || '#94a3b8';
  const artwork =
    activePokemon.sprites?.other?.['official-artwork']?.front_default ||
    activePokemon.sprites?.front_default;

  const handleClick = () => {
    if (onClick) onClick(activePokemon);
    if (onSelect) onSelect(activePokemon);
  };

  return (
    <div
      onClick={handleClick}
      className="pokemon-card"
      style={{
        width: '100%',
        minHeight: '230px',
        height: 'auto',
        backgroundColor: pastelBg,
        border: `2px solid ${borderColor}`,
        borderRadius: '20px',
        padding: '14px 12px 16px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Micro-patrones vectoriales decorativos en las esquinas según el tipo elemental */}
      <TypeDecorations type={primaryType} color={TYPE_BORDER_COLORS?.[primaryType]} />

      {/* 1. Encabezado con #ID */}
      <div style={{ width: '100%', textAlign: 'center', zIndex: 2 }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '800',
            color: '#64748b',
            letterSpacing: '0.5px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        >
          #{String(activePokemon.id).padStart(3, '0')}
        </span>
      </div>

      {/* 2. Centro: Contenedor con altura fija para el Sprite */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '115px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '6px 0',
          zIndex: 2,
        }}
      >
        {/* Halo de Pokéball decorativo */}
        <div
          style={{
            position: 'absolute',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.55)',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        {artwork && (
          <img
            src={artwork}
            alt={activePokemon.name}
            style={{
              maxHeight: '110px',
              maxWidth: '110px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
              zIndex: 2,
              transition: 'transform 0.2s ease',
            }}
          />
        )}
      </div>

      {/* 3. Base: Nombre + Badges de Tipos integrados sin absolute */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          zIndex: 2,
        }}
      >
        <span
          translate="no"
          className="notranslate"
          style={{
            fontSize: '14px',
            fontWeight: '900',
            textTransform: 'uppercase',
            color: '#0f172a',
            letterSpacing: '0.6px',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {activePokemon.name}
        </span>

        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {activePokemon.types?.map((t) => (
            <span
              key={t.type.name}
              style={{
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '10px',
                color: '#ffffff',
                backgroundColor: TYPE_BORDER_COLORS?.[t.type.name] || '#64748b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              }}
            >
              {TYPE_NAMES?.[language]?.[t.type.name] || t.type.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;
