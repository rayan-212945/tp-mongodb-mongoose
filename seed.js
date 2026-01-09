// seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Post = require('./models/Post');
const Category = require('./models/Category');
const Comment = require('./models/Comment');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🌱 Connexion MongoDB OK, initialisation des données...\n');

    // Nettoyer les collections
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Category.deleteMany({}),
      Comment.deleteMany({})
    ]);
    console.log('🧹 Collections vidées');

    // Créer des catégories
    const categories = await Category.create([
      { name: 'Technology', slug: 'technology', color: '#3B82F6' },
      { name: 'Design', slug: 'design', color: '#8B5CF6' },
      { name: 'Business', slug: 'business', color: '#10B981' }
    ]);
    console.log('📁 Catégories créées');

    // Créer des utilisateurs (usernames SANS underscore pour matcher ta validation)
    const users = await User.create([
      {
        username: 'johnDoe',
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin'
      },
      {
        username: 'janeSmith',
        email: 'jane@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith'
      }
    ]);
    console.log('👤 Utilisateurs créés');

    // Créer des posts
    const posts = await Post.create([
      {
        title: 'Getting Started with MongoDB',
        content: 'MongoDB is a powerful NoSQL database...',
        author: users[0]._id,
        category: categories[0]._id,
        status: 'published',
        tags: ['mongodb', 'database', 'nosql']
      },
      {
        title: 'Modern Web Design Trends',
        content: 'In 2024, web design continues to evolve...',
        author: users[1]._id,
        category: categories[1]._id,
        status: 'published',
        tags: ['design', 'ui', 'ux']
      }
    ]);
    console.log('📝 Posts créés');

    // Créer des commentaires
    await Comment.create([
      {
        content: 'Great article! Very helpful.',
        author: users[1]._id,
        post: posts[0]._id
      },
      {
        content: 'Thanks for sharing!',
        author: users[0]._id,
        post: posts[1]._id
      }
    ]);
    console.log('💬 Commentaires créés');

    console.log('\n✅ Base de données peuplée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed :', error);
    process.exit(1);
  }
};

seedDatabase();
