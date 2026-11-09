const TypeParticles = ({ type = 'normal', color = '#94a3b8' }) => {
  // Generamos 6 partículas con desfases y duraciones aleatorias fijas
  const particles = [
    { id: 1, left: '15%', size: 6, delay: '0s', duration: '4.2s' },
    { id: 2, left: '35%', size: 9, delay: '1.2s', duration: '5.5s' },
    { id: 3, left: '55%', size: 5, delay: '2.5s', duration: '3.8s' },
    { id: 4, left: '75%', size: 8, delay: '0.8s', duration: '4.8s' },
    { id: 5, left: '88%', size: 6, delay: '3.1s', duration: '5.1s' },
    { id: 6, left: '25%', size: 7, delay: '1.9s', duration: '4.5s' },
  ];

  const isAscending = ['fire', 'water', 'electric', 'poison', 'ghost'].includes(type);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <style>{`
        @keyframes particleFloatUp {
          0% {
            transform: translateY(110%) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          25% {
            opacity: 0.35;
          }
          75% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-20%) scale(1.1) rotate(45deg);
            opacity: 0;
          }
        }

        @keyframes particleFloatDown {
          0% {
            transform: translateY(-20%) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          25% {
            opacity: 0.35;
          }
          75% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(110%) scale(1.1) rotate(90deg);
            opacity: 0;
          }
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            bottom: isAscending ? '-10px' : 'auto',
            top: isAscending ? 'auto' : '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: type === 'grass' ? '0 100% 0 100%' : '50%',
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}80`,
            animation: `${isAscending ? 'particleFloatUp' : 'particleFloatDown'} ${p.duration} infinite linear`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

export default TypeParticles;
