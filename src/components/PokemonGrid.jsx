import PokemonCard from './PokemonCard';

const PokemonGrid = ({ pokemonList = [], onSelectPokemon, children }) => {
  return (
    <div style={{ width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        .pro-pokemon-grid {
          display: grid;
          width: 100%;
          /* Aumentamos el gap general para despegar las tarjetas */
          gap: 28px;
          /* Padding bottom de 100px para que el footer fijo NO tape las tarjetas */
          padding: 24px 24px 100px 24px;
          box-sizing: border-box;
          grid-template-columns: repeat(2, 1fr);
        }
        
        @media (min-width: 640px) {
          .pro-pokemon-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            padding: 24px 32px 100px 32px;
          }
        }
        
        @media (min-width: 1024px) {
          .pro-pokemon-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 32px;
            padding: 32px 40px 100px 40px;
          }
        }
        
        @media (min-width: 1440px) {
          .pro-pokemon-grid {
            grid-template-columns: repeat(6, 1fr);
            gap: 36px; /* Separación amplia y elegante */
            padding: 40px 48px 120px 48px;
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
