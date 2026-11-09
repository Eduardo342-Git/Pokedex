const PokeballWatermark = ({ size = '140px', opacity = 0.16, color = '#ffffff', rotate = 0 }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
        width: size,
        height: size,
        opacity: opacity,
        pointerEvents: 'none',
        zIndex: 0,
        fill: 'none',
        stroke: color,
        strokeWidth: 6.5,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Anillo exterior */}
      <circle cx="50" cy="50" r="45" />
      {/* Línea horizontal divisoria */}
      <line x1="5" y1="50" x2="95" y2="50" />
      {/* Botón central externo e interno */}
      <circle cx="50" cy="50" r="15" fill={color} stroke={color} strokeWidth="1" />
      <circle cx="50" cy="50" r="7" fill="transparent" stroke="#ffffff" strokeWidth="2.5" />
    </svg>
  );
};

export default PokeballWatermark;
