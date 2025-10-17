import express from "express";
import jwt from 'jsonwebtoken';

import { User } from "../bd.js"; 

const router = express.Router();

const JWT_SECRET = 'votre_super_clé_secrete'; 

// Suppression de la route '/inscription', qui est maintenant POST /users

// POST /authentification/login - Connexion utilisateur (Génération de JWT)
router.post("/login", async (request, response) => { 
    try {
        const user = await User.findOne({email : request.body.email}).select('+password');
        
        if (!user) {
            return response.status(404).json({error: "Pas d'utilisateur avec cet email"})
        }

        const match = await user.comparePassword(request.body.password);
        
        if (match) {
            const payload = {
                userID: user._id.toString(),
                userRole: user.role
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); 

            response.status(200).json({
                message: `Salut ${user.username}, tu as été connecté avec succès !`,
                token: token, 
                role: user.role
            })
        }
        else response.status(403).json({error: "Le mot de passe est incorrect !"});
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la connexion.", error: error.message })
    }
});

export default router;