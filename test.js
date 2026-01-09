const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');

// Fonction pour tester les performances
const testPerformance = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Analyse des performances...\n');

  // Test 1 : Sans index vs Avec index
  console.time('Recherche sans index');
  const result1 = await Post.find({
    tags: 'mongodb'
  }).explain('executionStats');
  console.timeEnd('Recherche sans index');

  console.log(
    'Documents examinés:',
    result1.executionStats.totalDocsExamined
  );
  console.log(
    'Documents retournés:',
    result1.executionStats.nReturned
  );

  // Test 2 : Recherche avec index de texte
  console.time('\nRecherche avec index texte');
  const result2 = await Post.find({
    $text: { $search: 'mongodb aggregation' }
  }).explain('executionStats');
  console.timeEnd('Recherche avec index texte');

  console.log(
    'Index utilisé:',
    result2.executionStats.executionStages.indexName
  );

  // Test 3 : Agrégation avec index
  console.time('\nAgrégation avec index');
  const result3 = await Post.aggregate([
    { $match: { status: 'published' } },
    { $sort: { viewCount: -1 } },
    { $limit: 10 }
  ]).explain('executionStats');
  console.timeEnd('Agrégation avec index');

  console.log(
    'Docs examinés (agrégation):',
    result3.executionStats.totalDocsExamined
  );

  // Afficher tous les index d'une collection
  console.log('\n📊 Index de la collection Posts:');
  const indexes = await Post.collection.getIndexes();
  console.table(indexes);
};


// 6.3 : Optimisation des requêtes

// 1. Requête NON optimisée
const slowQuery = async () => {
  const posts = await Post.find({})
    .populate('author')
    .populate('category')
    .populate('comments');
  // Problème : charge TOUT en mémoire
  return posts.filter(p => p.viewCount > 100);
};

// Version optimisée
const optimizedQuery = async () => {
  const page = 1;
  const limit = 20;

  return await Post.find()
    .where('viewCount').gt(100) // filtrage côté base
    .select('title excerpt author category viewCount createdAt')
    .populate('author', 'username avatar')
    .populate('category', 'name color')
    .sort({ viewCount: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(); // objets JS simples
};

// 2. Optimisation avec lean()
const getPostsForDisplay = async () => {
  // Version optimisée pour l'affichage (pas besoin des méthodes Mongoose)
  return await Post.find({ status: 'published' })
    .select('title excerpt author viewCount createdAt')
    .populate('author', 'username avatar')
    .sort('-createdAt')
    .limit(20)
    .lean(); // Retourne des objets JS simples (plus rapide)
};

// 3. Utilisation du cache
const CachedPost = {
  cache: new Map(),

  async findById(id) {
    if (this.cache.has(id)) {
      console.log('✅ Cache hit');
      return this.cache.get(id);
    }

    console.log('❌ Cache miss');
    const post = await Post.findById(id)
      .populate('author category')
      .lean();

    this.cache.set(id, post);
    // Expiration après 1 minute
    setTimeout(() => this.cache.delete(id), 60000);

    return post;
  }
};


// Lancer le test de performance (optionnel)
testPerformance()
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error('Erreur pendant le test de performance :', err);
    mongoose.disconnect();
  });
