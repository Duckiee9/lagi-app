import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { config, ROOT } from './config/app.js';
import { penangananGalat, tidakDitemukan } from './middleware/error.js';
import routes from './routes/index.js';

function cors(req, res, next) {
  const asal = req.headers.origin;
  if (asal && config.corsOrigin.includes(asal)) {
    res.set({
      'Access-Control-Allow-Origin': asal,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      Vary: 'Origin',
    });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
}

export function buatApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors);
  // Rute barang boleh membawa foto base64, jadi batasnya lebih besar. Parser pertama menang.
  app.use('/api/barang', express.json({ limit: '16mb' }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', routes);
  app.use('/api', tidakDitemukan);

  // Halaman uji API sederhana dan frontend hasil build (bila ada).
  app.use('/uji', express.static(path.join(ROOT, 'public')));
  const dist = path.join(ROOT, 'frontend', 'dist');
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_req, res, next) => res.sendFile(path.join(dist, 'index.html'), (e) => e && next()));

  app.use(penangananGalat);
  return app;
}
