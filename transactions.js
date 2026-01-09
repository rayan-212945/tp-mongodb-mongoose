require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

const deleteUserWithReassign = async (userId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1) trouver user à supprimer
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('Utilisateur introuvable');

    // 2) trouver / créer user "deleted"
    let deletedUser = await User.findOne({ username: 'deleted' }).session(session);

    if (!deletedUser) {
      const created = await User.create(
        [{
          username: 'deleted',
          email: 'deleted@system.com', // ✅ email valide pour ton regex
          password: 'password123',
          firstName: 'Deleted',
          lastName: 'User',
          role: 'user',
          isActive: false
        }],
        { session }
      );

      deletedUser = created[0];
    }

    // 3) Réassigner ses posts à deleted
    await Post.updateMany(
      { author: user._id },
      { $set: { author: deletedUser._id } },
      { session }
    );

    // 4) Supprimer ses commentaires
    await Comment.deleteMany({ author: user._id }).session(session);

    // 5) Supprimer l’utilisateur
    await User.deleteOne({ _id: user._id }).session(session);

    await session.commitTransaction();
    console.log('✅ Transaction réussie : utilisateur supprimé + posts réassignés vers "deleted"');
  } catch (err) {
    await session.abortTransaction();
    console.error('❌ Transaction échouée :', err.message);
  } finally {
    session.endSession();
  }
};

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const userIdToDelete = process.argv[2];
  if (!userIdToDelete) {
    console.log('❗ Utilisation : node transactions.js <USER_ID>');
    process.exit(0);
  }

  await deleteUserWithReassign(userIdToDelete);

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
