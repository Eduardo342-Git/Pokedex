const StatRadarChart = ({ stats = [], color = '#22c55e', size = 200 }) => {
  // stats esperado: array con valores ordenados [hp, atk, def, spAtk, spDef, spd]
  const center = size / 2;
  const radius = (size / 2) - 24;
  const statMax = 200; // Escala máxima representativa
  const labels = ['HP', 'ATK', 'DEF', 'S.ATK', 'S.DEF', 'SPD'];
  const totalAngles = 6;

  const getCoordinates = (value, index, currentRadius = radius) => {
    const angle = (Math.PI * 2 / totalAngles) * index - Math.PI / 2;
    const r = (value / statMax) * currentRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Coordenadas del polígono activo
  const points = labels.map((_, i) => {
    const val = stats[i] ?? 0;
    const { x, y } = getCoordinates(Math.min(val, statMax), i);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', margin: '0 auto' }}
      aria-label="Gráfico de radar de estadísticas base"
    >
      {/* Anillos concéntricos de referencia */}
      {[0.25, 0.5, 0.75, 1].map((scale, idx) => (
        <polygon
          key={idx}
          points={labels.map((_, i) => {
            const { x, y } = getCoordinates(statMax, i, radius * scale);
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          opacity="0.6"
        />
      ))}

      {/* Ejes radiales */}
      {labels.map((_, i) => {
        const { x, y } = getCoordinates(statMax, i);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#cbd5e1"
            strokeWidth="1"
            opacity="0.6"
          />
        );
      })}

      {/* Polígono de estadísticas */}
      <polygon
        points={points}
        fill={color}
        fillOpacity="0.35"
        stroke={color}
        strokeWidth="2.5"
        style={{ transition: 'all 0.3s ease' }}
      />

      {/* Etiquetas de las puntas */}
      {labels.map((label, i) => {
        const { x, y } = getCoordinates(statMax + 16, i);
        return (
          <text
            key={i}
            x={x}
            y={y + 3}
            textAnchor="middle"
            fontSize="9px"
            fontWeight="700"
            fill="#475569"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

export default StatRadarChart;

