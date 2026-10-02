import { createApp } from './app.js';
import { config } from './config.js';

// Punto di avvio del backend: crea l'app e la mette in ascolto.
const app = createApp();

app.listen(config.PORT, () => {
  console.log(`Gestionale avviato su http://localhost:${config.PORT}`);
});
