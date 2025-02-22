// backend/index.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-sdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

const db = admin.firestore();

// Endpoint pour assigner un rôle
app.post('/assign-role', async (req, res) => {
    const { uid, role } = req.body;
    try {
        await admin.auth().setCustomUserClaims(uid, { role });
        res.send({ success: true, message: `Rôle ${role} attribué à l'utilisateur ${uid}` });
    } catch (error) {
        res.status(500).send(error);
    }
});
// backend/index.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-sdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

const db = admin.firestore();

// Endpoint pour assigner un rôle
app.post('/assign-role', async (req, res) => {
    const { uid, role } = req.body;
    try {
        await admin.auth().setCustomUserClaims(uid, { role });
        res.send({ success: true, message: `Rôle ${role} attribué à l'utilisateur ${uid}` });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Endpoint pour récupérer les infos utilisateur
app.get('/user/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const user = await admin.auth().getUser(uid);
        res.send(user.customClaims || {});
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(3000, () => console.log('Serveur démarré sur le port 3000'));

// Frontend - React (index.html)
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentification</title>
    <script defer src="app.js"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Connexion / Inscription</h1>
        <input id="email" type="email" placeholder="Email">
        <input id="password" type="password" placeholder="Mot de passe">
        <button onclick="login()">Connexion</button>
        <button onclick="register()">Inscription</button>
        <button onclick="logout()">Déconnexion</button>
        <p id="user-info"></p>
    </div>
</body>
</html>

// Frontend - React (app.js)
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        auth.onAuthStateChanged(setUser);
    }, []);

    const login = () => signInWithEmailAndPassword(auth, email, password);
    const register = () => createUserWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    return (
        <div className='p-4'>
            {user ? (
                <div>
                    <p>Connecté en tant que {user.email}</p>
                    <button onClick={logout} className='bg-red-500 p-2 rounded'>Déconnexion</button>
                </div>
            ) : (
                <div>
                    <input placeholder='Email' onChange={e => setEmail(e.target.value)} />
                    <input type='password' placeholder='Mot de passe' onChange={e => setPassword(e.target.value)} />
                    <button onClick={login} className='bg-blue-500 p-2 rounded'>Connexion</button>
                    <button onClick={register} className='bg-green-500 p-2 rounded'>Inscription</button>
                </div>
            )}
        </div>
    );
}

export default App;

