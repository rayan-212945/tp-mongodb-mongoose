require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// 🔹 Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Connexion DB
connectDB();

// 🔹 Routes API
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/categories', require('./routes/categories'));


// 🔹 Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API MongoDB fonctionne!' });
});

// 🔹 Gestion des erreurs (toujours APRÈS les routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Quelque chose a mal tourné!',
    message: err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Serveur lancé sur http://localhost:${PORT}`);
});
