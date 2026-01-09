.

🧩 TP MongoDB & Mongoose – API Blog

Projet réalisé par Rayan Rizqi
MSc 1 – Data Engineer – ECE
TP Bases de données NoSQL – MongoDB & Mongoose

📌 Description du projet

Ce projet est une API REST complète développée avec Node.js, Express et MongoDB (Mongoose) permettant de gérer un système de blog avec :

Utilisateurs

Articles (posts)

Catégories

Commentaires hiérarchiques

Likes

Statistiques

Recherches full-text

Transactions MongoDB

Optimisation par index

Le projet met en œuvre les concepts avancés de MongoDB :
index, agrégations, transactions, performance, relations, soft delete, monitoring.

🛠️ Stack technique

Node.js

Express.js

MongoDB Atlas

Mongoose

dotenv

cors

📁 Structure du projet
tp-mongodb-mongoose/
│
├── config/
│   └── database.js
├── middleware/
│   └── monitoring.js
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   └── Category.js
├── routes/
│   ├── users.js
│   ├── posts.js
│   ├── comments.js
│   ├── categories.js
│   └── stats.js
│
├── seed.js
├── server.js
├── performance-test.js
├── optimized-query.js
├── transactions.js
├── package.json
└── .env

⚙️ Installation
npm install


Créer un fichier .env :

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tp_blog
PORT=3000

🌱 Initialiser la base de données
node seed.js


Cela crée :

2 utilisateurs

3 catégories

2 posts

2 commentaires

🚀 Lancer le serveur
node server.js


L’API est disponible sur :

http://localhost:3000

📡 Endpoints API principaux
🧑 Users
Méthode	URL	Description
GET	/api/users	Liste des utilisateurs
GET	/api/users/:id	Un utilisateur
POST	/api/users	Créer
PUT	/api/users/:id	Modifier
DELETE	/api/users/:id	Supprimer
PATCH	/api/users/:id/toggle-active	Activer / désactiver
GET	/api/users/:id/posts	Posts d’un user
GET	/api/users/:id/stats	Stats d’un user
📝 Posts
Méthode	URL	Description
GET	/api/posts	Liste paginée
GET	/api/posts/:id	Lire un post
POST	/api/posts	Créer
PUT	/api/posts/:id	Modifier
DELETE	/api/posts/:id	Supprimer
PATCH	/api/posts/:id/publish	Publier
PATCH	/api/posts/:id/like	Like
GET	/api/posts/search?q=...	Recherche
GET	/api/posts/trending	Posts tendance
GET	/api/posts/:id/comments	Arbre de commentaires
POST	/api/posts/:id/comments	Ajouter commentaire
💬 Comments
Méthode	URL
GET	/api/comments
GET	/api/comments/:id
POST	/api/comments
PUT	/api/comments/:id
DELETE	/api/comments/:id

Soft delete activé (isDeleted).

📂 Catégories
URL
GET /api/categories
GET /api/categories/:id/posts
📊 Statistiques
GET /api/stats/dashboard


Retourne :

Utilisateurs actifs

Posts par status

Top catégories

Articles les plus commentés

Activité sur 30 jours

🔍 Recherche & performance
Recherche textuelle

Un index textuel est défini sur :

title

content

tags

node performance-test.js


Affiche :

Temps de requête

Nombre de documents examinés

Index utilisés

Optimisation de requêtes
node optimized-query.js


Utilise un pipeline MongoDB optimisé avec index.

🔐 Transactions MongoDB

Suppression d’un utilisateur avec réaffectation de ses posts vers un compte système deleted.

node transactions.js <USER_ID>


Exemple :

node transactions.js 69612ac3409a772da2b9f5ae

📈 Index MongoDB utilisés

Index textuel full-text

Index composés :

author + status + createdAt

category + status + viewCount

featured + viewCount

Consultables via performance-test.js.

🧠 Concepts implémentés

Relations MongoDB (refs)

Aggregation pipelines

Index et performance

Soft delete

Monitoring des requêtes lentes

Transactions atomiques

Pagination

Recherche full-text

Arbres de commentaires

Statistiques

✅ Conclusion

Ce TP démontre une utilisation professionnelle de MongoDB et Mongoose pour construire une API complète, optimisée, robuste et scalable.

Il couvre :

Modélisation

Requêtes avancées

Performance

Sécurité

Transactions

Architecture REST