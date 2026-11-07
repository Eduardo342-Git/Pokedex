import axios from 'axios';

const BASE_URL = import.meta.env.VITE_POKEAPI_URL;

export const getPokemonList = async (limit = 20, offset = 0) => {
  try {
    const response = await axios.get(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    return response.data.results;
  } catch (error) {
    throw new Error('Error al obtener la lista de datos: ' + error.message, { cause: error });
  }
};

export const getPokemonDetails = async (nameOrId) => {
  try {
    const response = await axios.get(`${BASE_URL}/pokemon/${String(nameOrId).toLowerCase()}`);
    return response.data;
  } catch (error) {
    throw new Error(`No se pudo obtener la información de "${nameOrId}"`, { cause: error });
  }
};
