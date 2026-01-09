require('dotenv').config();
const mongoose = require('mongoose');

const Post = require('./models/Post');

const slowQuery = async () => {
  console.time('SLOW');
  const posts = await Post.find({})
    .populate('author')
    .populate('category')
    .populate('comments'); // (mauvais) : charge tout en mémoire

  const filtered = posts.filter(p => p.viewCount > 100);
  console.timeEnd('SLOW');

  console.log('SLOW - posts retournés:', filtered.length);
};

const optimizedQuery = async () => {
  console.time('OPTIMIZED');

  const posts = await Post.find({ status: 'published', viewCount: { $gt: 100 } })
    .select('title excerpt author viewCount createdAt') // ✅ champs utiles seulement
    .populate('author', 'username avatar firstName lastName fullName') // ✅ populate limité
    .sort({ viewCount: -1 }) // ✅ tri DB
    .limit(20) // ✅ pagination
    .lean(); // ✅ objets JS simples (plus rapide)

  console.timeEnd('OPTIMIZED');
  console.log('OPTIMIZED - posts retournés:', posts.length);
  console.log(posts);
};

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('\n⚡ Test optimisation requête\n');

  // Lance juste l’optimisée (tu peux décommenter slowQuery si tu veux comparer)
  // await slowQuery();
  await optimizedQuery();

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
