import { useState, useEffect } from 'react';
import { getPokemonList } from './services/pokemonService';
import PokemonCard from './components/PokemonCard';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        setLoading(true);
        const data = await getPokemonList(20, 0);
        setPokemonList(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPokemons();
  }, []);

  const filteredPokemons = pokemonList.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        padding: '20px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ textAlign: 'center', color: '#0f172a' }}>Catálogo Pokédex</h1>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px',
            width: '280px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
          }}
        />
      </div>
      {loading && (
        <h2 style={{ textAlign: 'center', color: '#475569' }}>
          Cargando datos desde el servidor...
        </h2>
      )}
      {error && <h2 style={{ textAlign: 'center', color: '#dc2626' }}>Error: {error}</h2>}
      {!loading && !error && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {filteredPokemons.length > 0 ? (
            filteredPokemons.map((pokemon) => (
              <PokemonCard key={pokemon.name} pokemonName={pokemon.name} />
            ))
          ) : (
            <p>No se encontraron coincidencias.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
