import PokemonCard from './PokemonCard';

const PokemonGrid = ({ pokemonList = [], onSelectPokemon, children }) => {
  return (
    <div
      className="pokemon-grid-container"
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        padding: '16px 24px 32px 24px',
        boxSizing: 'border-box',
        display: 'grid',
        /* Columnas fluidas: mínimo 200px en PC, nunca se apelmazan ni se montan */
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .responsive-pokemon-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            padding: 12px 10px 24px 10px !important;
          }
        }
      `}</style>
      <div className="responsive-pokemon-grid" style={{ display: 'contents' }}>
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
