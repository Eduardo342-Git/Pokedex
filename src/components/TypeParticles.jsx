const TypeParticles = ({ type = 'normal', color = '#38bdf8' }) => {
  const particles = [
    { id: 1, left: '12%', size: 9, delay: '0s', duration: '3.8s' },
    { id: 2, left: '28%', size: 14, delay: '1s', duration: '4.8s' },
    { id: 3, left: '50%', size: 8, delay: '2.2s', duration: '3.5s' },
    { id: 4, left: '72%', size: 12, delay: '0.5s', duration: '4.2s' },
    { id: 5, left: '88%', size: 9, delay: '2.8s', duration: '4.5s' },
    { id: 6, left: '38%', size: 11, delay: '1.6s', duration: '5s' },
  ];

  const isAscending = ['water', 'fire', 'electric', 'poison', 'ghost'].includes(type);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1, // Suficientemente alto para ser visible sobre los lienzos pastel
      }}
    >
      <style>{`
        @keyframes particleFloatUp {
          0% {
            transform: translateY(105%) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 0.75;
          }
          80% {
            opacity: 0.75;
          }
          100% {
            transform: translateY(-15%) scale(1.15);
            opacity: 0;
          }
        }

        @keyframes particleFloatDown {
          0% {
            transform: translateY(-15%) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.75;
          }
          80% {
            opacity: 0.75;
          }
          100% {
            transform: translateY(105%) scale(1.15) rotate(90deg);
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
            bottom: isAscending ? '-15px' : 'auto',
            top: isAscending ? 'auto' : '-15px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: type === 'grass' ? '0 100% 0 100%' : '50%',
            backgroundColor: color,
            border: type === 'water' ? '2px solid rgba(255,255,255,0.9)' : 'none',
            boxShadow: `0 0 10px ${color}, 0 0 4px #ffffff`, // Resplandor fosforescente nítido
            animation: `${isAscending ? 'particleFloatUp' : 'particleFloatDown'} ${p.duration} infinite ease-in-out`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

export default TypeParticles;
