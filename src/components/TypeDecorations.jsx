const containerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 0,
};

const TypeDecorations = ({ type = 'normal', color = '#94a3b8' }) => {
  const strokeColor = color;

  switch (type) {
    case 'grass':
      // Hojas orgánicas en esquinas opuestas
      return (
        <svg viewBox="0 0 100 100" style={containerStyle} aria-hidden="true">
          <path
            d="M10,25 C10,12 25,10 25,25 C25,38 10,25 10,25 Z M18,17 L25,25"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            opacity="0.18"
          />
          <path
            d="M85,80 C85,68 95,70 95,82 C95,95 85,80 85,80 Z M88,74 L94,82"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            opacity="0.18"
          />
        </svg>
      );

    case 'fire':
      // Pequeñas flamas estilizadas
      return (
        <svg viewBox="0 0 100 100" style={containerStyle} aria-hidden="true">
          <path
            d="M18,30 Q12,20 18,14 Q22,22 24,18 Q26,26 18,30 Z"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            opacity="0.20"
          />
          <path
            d="M84,86 Q78,74 84,68 Q88,76 90,72 Q92,80 84,86 Z"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            opacity="0.20"
          />
        </svg>
      );

    case 'water':
      // Ondas y gotas marinas
      return (
        <svg viewBox="0 0 100 100" style={containerStyle} aria-hidden="true">
          <circle
            cx="20"
            cy="20"
            r="8"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.16"
          />
          <path
            d="M80,80 Q85,72 90,80"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            opacity="0.2"
          />
          <path
            d="M75,85 Q85,75 95,85"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            opacity="0.2"
          />
        </svg>
      );

    case 'bug':
      // Panal hexagonal
      return (
        <svg viewBox="0 0 100 100" style={containerStyle} aria-hidden="true">
          <polygon
            points="18,12 26,16 26,26 18,30 10,26 10,16"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.18"
          />
          <polygon
            points="86,74 94,78 94,88 86,92 78,88 78,78"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.18"
          />
        </svg>
      );

    case 'electric':
      // Rayos / zigzag
      return (
        <svg viewBox="0 0 100 100" style={containerStyle} aria-hidden="true">
          <polyline
            points="15,10 22,18 17,20 24,30"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            opacity="0.22"
          />
          <polyline
            points="82,70 89,78 84,80 91,90"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            opacity="0.22"
          />
        </svg>
      );

    case 'fairy':
    case 'psychic':
      // Destellos y estrellas de 4 puntas
      return (
        <svg viewBox="0 0 100 100" style={containerStyle} aria-hidden="true">
          <path
            d="M20,10 Q20,20 10,20 Q20,20 20,30 Q20,20 30,20 Q20,20 20,10 Z"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.2"
          />
          <path
            d="M85,75 Q85,82 78,82 Q85,82 85,89 Q85,82 92,82 Q85,82 85,75 Z"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.2"
          />
        </svg>
      );

    default: // normal, roca, etc.: círculos orbitales discretos
      return (
        <svg viewBox="0 0 100 100" style={containerStyle} aria-hidden="true">
          <circle
            cx="18"
            cy="18"
            r="10"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.15"
          />
          <circle
            cx="86"
            cy="84"
            r="8"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            opacity="0.15"
          />
        </svg>
      );
  }
};

export default TypeDecorations;
