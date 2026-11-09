function PokemonGrid({ children, className = '', style = {} }) {
  return (
    <div
      className={`pokemon-grid-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
        padding: '12px',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default PokemonGrid;
