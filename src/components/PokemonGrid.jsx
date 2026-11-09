import PokemonCard from './PokemonCard';

const PokemonGrid = ({ pokemonList = [], onSelectPokemon, children }) => {
  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      <style>{`
        /* 1. LAYOUT DE CUADRÍCULA */
        .pro-grid {
          display: grid;
          width: 100%;
          max-width: 1800px;
          margin: 0 auto;
          box-sizing: border-box;
          /* Celular por defecto: 2 columnas, espaciado seguro */
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px 12px 100px 12px;
        }
        @media (min-width: 640px) {
          .pro-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 24px 24px 100px 24px; }
        }
        @media (min-width: 1024px) {
          .pro-grid { grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 32px 32px 100px 32px; }
        }
        @media (min-width: 1440px) {
          .pro-grid { grid-template-columns: repeat(6, 1fr); gap: 32px; padding: 40px 48px 120px 48px; }
        }

        /* 2. DISEÑO DE TARJETA FLUIDA */
        .pro-card {
          width: 100%;
          height: 100%;
          min-height: 190px; /* Evita el colapso en móviles */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          border-radius: 16px;
          padding: 12px 8px;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pro-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }
        
        /* Elementos Internos: Móvil por defecto */
        .pro-card-id { font-size: 11px; font-weight: 800; color: #64748b; z-index: 2; }
        .pro-card-sprite-wrapper {
          flex: 1 1 auto;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin: 12px 0;
          min-height: 90px;
        }
        .pro-card-halo {
          position: absolute;
          width: 90px; height: 90px;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.2);
          z-index: 1;
        }
        .pro-card-img {
          width: 85px; height: 85px;
          object-fit: contain;
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15));
          z-index: 2;
          transition: transform 0.2s ease;
        }
        .pro-card-name {
          font-size: 13px; font-weight: 900; text-transform: uppercase;
          color: #0f172a; text-align: center; letter-spacing: 0.5px; margin-bottom: 6px;
        }
        .pro-card-types { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; z-index: 2; width: 100%; }
        .pro-card-type {
          font-size: 9px; font-weight: 800; text-transform: uppercase;
          padding: 3px 8px; border-radius: 6px; color: #fff;
        }

        /* Escalado majestuoso para PC / Desktop */
        @media (min-width: 1024px) {
          .pro-card { min-height: 270px; padding: 20px 16px; border-radius: 24px; }
          .pro-card-id { font-size: 14px; }
          .pro-card-halo { width: 145px; height: 145px; }
          .pro-card-img { width: 135px; height: 135px; }
          .pro-card-name { font-size: 17px; margin-bottom: 8px; }
          .pro-card-type { font-size: 11px; padding: 4px 12px; border-radius: 8px; }
        }
      `}</style>

      <div className="pro-grid">
        {children
          ? children
          : pokemonList.map((pokemon) => (
              <PokemonCard
                key={pokemon.id || pokemon.name}
                pokemon={pokemon}
                onClick={() => onSelectPokemon && onSelectPokemon(pokemon.id || pokemon)}
              />
            ))}
      </div>
    </div>
  );
};

export default PokemonGrid;
