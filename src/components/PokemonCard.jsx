import { useState, useEffect } from 'react';
import { getPokemonDetails } from '../services/pokemonService';

const cardStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  padding: '15px',
  margin: '10px',
  width: '180px',
  textAlign: 'center',
  backgroundColor: '#ffffff',
};

function PokemonCard({ pokemonName }) {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const data = await getPokemonDetails(pokemonName);
        setPokemon(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [pokemonName]);

  if (loading) return <div style={cardStyle}>Cargando registro...</div>;
  if (!pokemon) return null;

  return (
    <div style={cardStyle}>
      <img
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
        style={{ width: '100px', height: '100px' }}
      />
      <h3 style={{ textTransform: 'capitalize' }}>
        #{pokemon.id} {pokemon.name}
      </h3>
      <div>
        <strong>Tipos: </strong>
        {pokemon.types.map((t) => t.type.name).join(', ')}
      </div>
      <p>
        <strong>HP:</strong> {pokemon.stats[0].base_stat} | <strong>Ataque:</strong>{' '}
        {pokemon.stats[1].base_stat}
      </p>
    </div>
  );
}

export default PokemonCard;
