import PokemonCard from './PokemonCard';

// Recibe 'cols' como prop desde el componente padre
const PokemonGrid = ({ pokemonList = [], onSelectPokemon, cols = 2, children }) => {
  return (
    <div 
      style={{ 
        width: '100%', 
        margin: '0', 
        /* Padding lateral con 'vw' (viewport width) asegura un margen fluido de borde a borde */
        padding: '24px 3vw 120px 3vw', 
        boxSizing: 'border-box' 
      }}
    >
      <div 
        style={{
          display: 'grid',
          width: '100%',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 'clamp(12px, 2vw, 28px)', /* El gap crece suavemente con la pantalla */
          justifyContent: 'center',
        }}
      >
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
