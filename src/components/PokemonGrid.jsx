import PokemonCard from './PokemonCard';

const PokemonGrid = ({ pokemonList = [], onSelectPokemon, children }) => {
  return (
    <div style={{ width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        .pro-pokemon-grid {
          display: grid;
          width: 100%;
          padding: 24px;
          gap: 24px;
          box-sizing: border-box;
          /* Móvil por defecto: 2 columnas */
          grid-template-columns: repeat(2, 1fr);
        }
        
        /* Tablets: 3 columnas */
        @media (min-width: 640px) {
          .pro-pokemon-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 24px 32px;
          }
        }
        
        /* Laptops: 4 columnas */
        @media (min-width: 1024px) {
          .pro-pokemon-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 28px;
            padding: 32px 40px;
          }
        }
        
        /* Desktop / Monitores grandes: 6 columnas exactas de margen a margen */
        @media (min-width: 1440px) {
          .pro-pokemon-grid {
            grid-template-columns: repeat(6, 1fr);
            gap: 32px;
            padding: 40px 48px;
          }
        }
      `}</style>

      <div className="pro-pokemon-grid">
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
