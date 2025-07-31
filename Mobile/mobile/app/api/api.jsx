// api.js
import axios from 'axios';

const ApiBase = axios.create({
  baseURL: 'http://192.168.0.222:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default ApiBase;
