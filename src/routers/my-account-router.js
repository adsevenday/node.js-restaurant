import express from "express";

import { User } from "../bd.js";
import { authenticate } from "../middlewares/authentication-middleware.js"; // IMPORT MODIFIÉ

const router = express.Router();

// GET /my_account - Obtenir les détails de l'utilisateur actuel (via JWT ID)
router.get("/", authenticate, async (request, response) => {
  try {
    // request.user.userID vient du payload JWT décodé par le middleware 'authenticate'
    const user = await User.findById(request.user.userID).select('-password'); 

    if (!user) {
        return response.status(404).json({ message: "Utilisateur introuvable." });
    }
    
    response.status(200).json(user);
  } catch (error) {
    response.status(500).json({ message: "Erreur lors de la récupération du compte.", error });
  }
});

// GET /my_account/logout - Simuler la déconnexion (côté client, mais on garde la route pour la clarté)
router.get("/logout", (request, response) => {
  // Dans un système JWT, il suffit de dire au client de jeter le token.
  // La route session.destroy() est retirée.
  response.status(200).json({ message: "Vous avez été déconnecté avec succès (le token n'est plus valide pour le client) !" });
});

export default router;  