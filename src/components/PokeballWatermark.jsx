const PokeballWatermark = ({
  size = '60%',
  opacity = 0.30,
  color = '#ffffff',
  rotate = 0,
  scale = 1,
  style = {},
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
        width: size,
        maxWidth: size,
        aspectRatio: '1 / 1',
        opacity: opacity,
        pointerEvents: 'none',
        zIndex: 0,
        fill: 'none',
        stroke: color,
        strokeWidth: 6.5,
        transition: 'transform 0.4s ease, opacity 0.3s ease',
        ...style,
      }}
    >
      {/* Círculo exterior perimetral */}
      <circle cx="50" cy="50" r="45" />
      {/* Línea horizontal divisoria */}
      <line x1="5" y1="50" x2="95" y2="50" />
      {/* Botón circular central externo e interno */}
      <circle cx="50" cy="50" r="16" fill={color} stroke={color} strokeWidth="1" />
      <circle cx="50" cy="50" r="7.5" fill="#ffffff" stroke={color} strokeWidth="3" />
    </svg>
  );
};

export default PokeballWatermark;
