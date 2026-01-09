const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connecté avec succès');
        // Événements de connexion
        mongoose.connection.on('error', (err) => {
            console.error('❌ Erreur MongoDB:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB déconnecté');
        });

    } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
    }

};

module.exports = connectDB;