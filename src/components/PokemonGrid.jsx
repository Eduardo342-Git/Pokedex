function PokemonGrid({ children, className = '', style = {} }) {
  return (
    <div
      className={`pokemon-grid-container ${className}`}
      style={{
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default PokemonGrid;

