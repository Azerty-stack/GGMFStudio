import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import pg from 'pg';
import nodemailer from 'nodemailer';

env.config();

const app = express();
const server = require('http').createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;

// Fonction pour envoyer un e-mail de vérification
async function sendVerificationEmail(email, token) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const link = `https://votresite.com/verify?token=${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Vérification de votre compte',
        text: `Cliquez sur ce lien pour vérifier votre compte : ${link}`
    });
}

// Inscription
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email }, SECRET, { expiresIn: '1d' });

    try {
        await pool.query('INSERT INTO users (email, password, verified) VALUES ($1, $2, false)', [email, hashedPassword]);
        await sendVerificationEmail(email, token);
        res.json({ message: 'Inscription réussie, vérifiez votre e-mail' });
    } catch (error) {
        res.status(400).json({ error: 'Erreur lors de l'inscription' });
    }
});

// Vérification de l'e-mail
app.get('/verify', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, SECRET);
        await pool.query('UPDATE users SET verified = true WHERE email = $1', [decoded.email]);
        res.send('Compte vérifié !');
    } catch (error) {
        res.status(400).send('Lien invalide ou expiré');
    }
});

// Connexion
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0 || !user.rows[0].verified) {
        return res.status(401).json({ error: 'Utilisateur non vérifié ou inexistant' });
    }
    const isValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isValid) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    const token = jwt.sign({ email }, SECRET, { expiresIn: '1d' });
    res.json({ token });
});

io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');
    socket.on('update', () => {
        io.emit('refresh');
    });
});

server.listen(3000, () => console.log('Serveur démarré sur le port 3000'));
