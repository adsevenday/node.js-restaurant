import express from "express";
import jwt from 'jsonwebtoken'; // NOUVEL IMPORT

import { User } from "../bd.js"; 

const router = express.Router();

// Clé secrète (doit être la même que dans le middleware)
const JWT_SECRET = 'votre_super_clé_secrete'; 

// POST /authentification/inscription (Pas de changement dans la logique d'inscription)
router.post('/inscription', (request, response) => {
    // ... (Logique d'inscription inchangée) ...
    const newUser = new User({ 
        email: request.body.email,
        username: request.body.username,
        password: request.body.password,
        role: 'user' // Force le rôle à 'user' pour la sécurité (conformément aux exigences)
    });
    
    newUser.save()
    .then(
        user => {
            const userResponse = { id: user._id, email: user.email, username: user.username, role: user.role };
            response.status(200).json({ message: `Bienvenue ${user.username}, ton compte a été créé avec succès. Tu peux te connecter !`, user: userResponse })
        }
    )
    .catch(
        error => {
            if (error.code === 11000) {
                return response.status(409).json({ message: "Email déjà existant, veuillez utiliser une autre adresse !" });
            }
            response.status(500).json({ message: "Erreur lors de l'inscription.", error: error.message })
        }
    )
});

// POST /authentification/login - Connexion utilisateur (Génération de JWT)
// NOTE: Change GET to POST (recommandé pour le login)
router.post("/login", async (request, response) => { 
    try {
        const user = await User.findOne({email : request.body.email}).select('+password');
        
        if (!user) {
            return response.status(404).json({error: "Pas d'utilisateur avec cet email"})
        }

        const match = await user.comparePassword(request.body.password);
        
        if (match) {
            // 1. Créer le Payload du JWT (ID et Rôle sont essentiels)
            const payload = {
                userID: user._id.toString(), // Important de le convertir en string pour la comparaison ultérieure
                userRole: user.role
            };

            // 2. Signer le Token
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expire après 1 heure

            // 3. Retourner le token (stateless)
            response.status(200).json({
                message: `Salut ${user.username}, tu as été connecté avec succès !`,
                token: token, // Le client doit stocker ce token
                role: user.role
            })
        }
        else response.status(403).json({error: "Le mot de passe est incorrect !"});
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la connexion.", error: error.message })
    }
});

export default router;