require('dotenv').config();
const mongoose = require('mongoose');

const Post = require('./models/Post');

const testPerformance = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('\n🔍 Analyse des performances MongoDB\n');

  // Test 1 : Recherche simple (tags)
  console.time('Recherche simple (tags)');
  const result1 = await Post.find({ tags: 'mongodb' }).explain('executionStats');
  console.timeEnd('Recherche simple (tags)');
  console.log('Docs examinés :', result1.executionStats.totalDocsExamined);
  console.log('Docs retournés :', result1.executionStats.nReturned);

  // Test 2 : Recherche texte (index text)
  console.time('Recherche texte');
  const result2 = await Post.find({
    $text: { $search: 'mongodb database' }
  }).explain('executionStats');
  console.timeEnd('Recherche texte');

  // Selon versions, indexName peut être ici ou plus profond
  const usedIndex =
    result2.executionStats?.executionStages?.indexName ||
    result2.executionStats?.executionStages?.inputStage?.indexName ||
    'Non trouvé';

  console.log('Index utilisé :', usedIndex);
  console.log('Docs examinés :', result2.executionStats.totalDocsExamined);
  console.log('Docs retournés :', result2.executionStats.nReturned);

  // Test 3 : Agrégation (top posts publiés)
  console.time('Top posts publiés');
  const result3 = await Post.aggregate([
    { $match: { status: 'published' } },
    { $sort: { viewCount: -1 } },
    { $limit: 5 }
  ]).explain('executionStats');
  console.timeEnd('Top posts publiés');

  console.log('Docs examinés (agg) :', result3.executionStats.totalDocsExamined);

  // Afficher tous les index de la collection
  console.log('\n📊 Index de la collection Posts');
  const indexes = await Post.collection.getIndexes();
  console.table(indexes);

  await mongoose.disconnect();
};

testPerformance().catch((err) => {
  console.error('❌ Erreur test performance :', err);
  process.exit(1);
});
