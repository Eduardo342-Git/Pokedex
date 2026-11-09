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
        className="pro-card"
        style={{
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          justifyContent: 'center',
          cursor: 'default',
        }}
      >
        <p style={{ color: '#64748b', fontSize: '12px', margin: 0, fontWeight: 500 }}>
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
      className="pro-card"
      onClick={handleClick}
      style={{
        backgroundColor: pastelBg,
        border: `2px solid ${borderColor}`,
        cursor: 'pointer',
      }}
    >
      {/* Micro-patrones vectoriales decorativos en las esquinas según el tipo elemental */}
      <TypeDecorations type={primaryType} color={TYPE_BORDER_COLORS?.[primaryType]} />

      {/* ID */}
      <span className="pro-card-id">
        #{String(activePokemon.id).padStart(3, '0')}
      </span>

      {/* Sprite y Halo */}
      <div className="pro-card-sprite-wrapper">
        <div className="pro-card-halo" />
        {artwork && (
          <img
            src={artwork}
            alt={activePokemon.name}
            className="pro-card-img"
          />
        )}
      </div>

      {/* Nombre y Tipos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', zIndex: 2 }}>
        <span translate="no" className="notranslate pro-card-name">
          {activePokemon.name}
        </span>
        <div className="pro-card-types">
          {activePokemon.types?.map((t) => (
            <span
              key={t.type.name}
              className="pro-card-type"
              style={{ backgroundColor: TYPE_BORDER_COLORS?.[t.type.name] || '#64748b' }}
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
