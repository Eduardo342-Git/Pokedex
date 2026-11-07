import { useEffect } from 'react';
import { TYPE_COLORS } from '../utils/pokemonTypes';

const STAT_LABELS = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
};

const getBarColor = (value) => {
  if (value < 70) return '#f59e0b';
  if (value <= 100) return '#22c55e';
  return '#06b6d4';
};

function PokemonModal({ pokemon, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!pokemon) return null;

  const playCry = () => {
    const audioUrl = pokemon.cries?.latest || pokemon.cries?.legacy;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = 0.6;
      audio.play().catch((e) => console.warn('Audio no disponible', e));
    }
  };

  const hasCry = Boolean(pokemon.cries?.latest || pokemon.cries?.legacy);
  const formattedId = `#${String(pokemon.id).padStart(3, '0')}`;
  const artworkUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default;

  const totalStats =
    pokemon.stats?.reduce((acc, curr) => acc + curr.base_stat, 0) || 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Carcasa de la Mini Pokédex Retro-Moderna */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
          position: 'relative',
          background: 'linear-gradient(145deg, #dc2626 0%, #b91c1c 100%)',
          border: '4px solid #991b1b',
          borderRadius: '24px',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#0f172a',
        }}
      >
        {/* 1. Cabecera de Luces y Sensores (Top Bar) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #7f1d1d',
          }}
        >
          {/* Lente principal y 3 luces */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Lente azul cian */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '3px solid #ffffff',
                background:
                  'radial-gradient(circle at 30% 30%, #38bdf8, #0284c7 70%, #0369a1)',
                boxShadow:
                  '0 0 10px rgba(56, 189, 248, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            />
            {/* 3 luces pequeñas: roja, amarilla y verde */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#facc15',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 0 4px rgba(250, 204, 21, 0.8)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 0 4px rgba(34, 197, 94, 0.8)',
                }}
              />
            </div>
          </div>

          {/* Botón de cierre en tono vino/rojo oscuro */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Pokédex"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#7f1d1d',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991b1b')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7f1d1d')}
          >
            ✕
          </button>
        </div>

        {/* 2. Pantalla Interior LCD de Datos (Bisel Gris + Contenido) */}
        <div
          style={{
            backgroundColor: '#e2e8f0',
            border: '2px solid #cbd5e1',
            borderRadius: '16px',
            padding: '16px 14px',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Dos pequeños puntos rojos superiores estilo LED/micrófono */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 3px rgba(239, 68, 68, 0.7)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 3px rgba(239, 68, 68, 0.7)',
                display: 'inline-block',
              }}
            />
          </div>

          {/* Área visual de la pantalla LCD */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* ID y Nombre */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                }}
              >
                {formattedId}
              </span>
              <h2
                style={{
                  margin: '2px 0 0',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  textTransform: 'capitalize',
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}
              >
                {pokemon.name}
              </h2>
            </div>

            {/* Sprite Oficial en fondo circular suave */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: '135px',
                  height: '135px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, #e2e8f0 0%, #f1f5f9 70%, transparent 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #cbd5e1',
                }}
              >
                {artworkUrl ? (
                  <img
                    src={artworkUrl}
                    alt={pokemon.name}
                    style={{
                      width: '130px',
                      height: '130px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))',
                    }}
                  />
                ) : (
                  <span style={{ color: '#94a3b8' }}>Sin imagen</span>
                )}
              </div>
            </div>

            {/* Badges de Tipos */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '12px',
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
                      padding: '3px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {type.name}
                  </span>
                );
              })}
            </div>

            {/* Botón de Audio (Función Pokédex) */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={playCry}
                disabled={!hasCry}
                style={{
                  backgroundColor: hasCry ? '#0284c7' : '#94a3b8',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '7px 18px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: hasCry ? 'pointer' : 'not-allowed',
                  opacity: hasCry ? 1 : 0.6,
                  transition: 'background-color 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: hasCry ? '0 2px 6px rgba(2, 132, 199, 0.35)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (hasCry) e.currentTarget.style.backgroundColor = '#0369a1';
                }}
                onMouseLeave={(e) => {
                  if (hasCry) e.currentTarget.style.backgroundColor = '#0284c7';
                }}
              >
                🔊 Escuchar Sonido
              </button>
            </div>

            {/* Estadísticas Base y Total */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Estadísticas Base
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Total: {totalStats}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pokemon.stats?.map((s) => {
                  const label = STAT_LABELS[s.stat.name] || s.stat.name.toUpperCase();
                  const val = s.base_stat;
                  const percentage = Math.min(100, (val / 255) * 100);
                  const barColor = getBarColor(val);

                  return (
                    <div
                      key={s.stat.name}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '55px 30px 1fr',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#64748b' }}>{label}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#0f172a',
                          textAlign: 'right',
                        }}
                      >
                        {val}
                      </span>
                      <div
                        style={{
                          height: '7px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: barColor,
                            borderRadius: '9999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Detalles Físicos Inferiores (Mandos Pokédex) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            padding: '4px 10px 0',
          }}
        >
          {/* Botón circular grande negro a la izquierda */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              border: '2px solid #0f172a',
              boxShadow:
                'inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.5)',
            }}
          />

          {/* Dos líneas horizontales estilo altavoz en el centro */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '4px',
                backgroundColor: '#7f1d1d',
                borderRadius: '2px',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            />
            <div
              style={{
                width: '42px',
                height: '4px',
                backgroundColor: '#7f1d1d',
                borderRadius: '2px',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            />
          </div>

          {/* Cruceta direccional negra (D-pad en cruz) a la derecha */}
          <div
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
            }}
          >
            {/* Barra horizontal */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: 0,
                width: '36px',
                height: '12px',
                backgroundColor: '#1e293b',
                borderRadius: '3px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              }}
            />
            {/* Barra vertical */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '12px',
                width: '12px',
                height: '36px',
                backgroundColor: '#1e293b',
                borderRadius: '3px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              }}
            />
            {/* Hendidura central */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#0f172a',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PokemonModal;
