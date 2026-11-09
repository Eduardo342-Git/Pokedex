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
          aspectRatio: '4 / 5',
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: 'clamp(12px, 1.5vw, 20px)',
          padding: '5% 4%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default',
        }}
      >
        <p style={{ color: '#64748b', fontSize: 'clamp(10px, 1vw, 14px)', margin: 0, fontWeight: 500 }}>
          {language === 'es' ? 'Sintonizando...' : 'Tuning in...'}
        </p>
      </div>
    );
  }

  const primaryType = activePokemon.types?.[0]?.type?.name || 'normal';
  const pastelBg = TYPE_PASTEL_COLORS?.[primaryType] || '#f8fafc';
  const borderColor = TYPE_BORDER_COLORS?.[primaryType] || '#cbd5e1';
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
        aspectRatio: '4 / 5', // Proporción estricta tipo carta
        backgroundColor: pastelBg,
        border: `2px solid ${borderColor}`,
        borderRadius: 'clamp(12px, 1.5vw, 20px)',
        padding: '5% 4%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Micro-patrones vectoriales decorativos en las esquinas según el tipo elemental */}
      <TypeDecorations type={primaryType} color={TYPE_BORDER_COLORS?.[primaryType]} />

      {/* ID del Pokémon */}
      <span
        style={{
          fontSize: 'clamp(10px, 1vw, 14px)',
          fontWeight: '800',
          color: '#64748b',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          zIndex: 2,
        }}
      >
        #{String(activePokemon.id).padStart(3, '0')}
      </span>

      {/* Contenedor del Sprite que ocupa el espacio restante fluidamente */}
      <div
        style={{
          flex: '1 1 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          margin: '2% 0',
          zIndex: 2,
        }}
      >
        {/* Halo Vectorial Relativo */}
        <div
          style={{
            position: 'absolute',
            width: '70%',
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.6)',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        {/* Imagen del Pokémon limitando a los bordes de la tarjeta */}
        {artwork && (
          <img
            src={artwork}
            alt={activePokemon.name}
            style={{
              width: '82%',
              height: '82%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))',
              zIndex: 2,
              transition: 'transform 0.2s ease',
            }}
          />
        )}
      </div>

      {/* Base: Nombre y Tipos */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          zIndex: 2,
        }}
      >
        <span
          translate="no"
          className="notranslate"
          style={{
            fontSize: 'clamp(11px, 1.2vw, 16px)',
            fontWeight: '900',
            textTransform: 'uppercase',
            color: '#0f172a',
            textAlign: 'center',
            letterSpacing: '0.5px',
          }}
        >
          {activePokemon.name}
        </span>

        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {activePokemon.types?.map((t) => (
            <span
              key={t.type.name}
              style={{
                fontSize: 'clamp(8.5px, 0.8vw, 11px)',
                fontWeight: '800',
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '6px',
                color: '#ffffff',
                backgroundColor: TYPE_BORDER_COLORS?.[t.type.name] || '#64748b',
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
