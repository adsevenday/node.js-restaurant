import express from "express";
import bcrypt from "bcrypt";

import { User } from "../bd.js"; // IMPORT MODIFIÉ
// IMPORT MODIFIÉ: isOwnerOrAdmin gère la logique admin/propriétaire
import { isAdmin, isOwnerOrAdmin, authenticate } from "../middlewares/authentication-middleware.js"; 
import { isValidID, userExists } from "../middlewares/params-middleware.js";

const router = express.Router();

// GET /users - Lister tous les utilisateurs (Admin requis)
router.get("/", authenticate, isAdmin, async (request, response) => {
  const users = await User.find().select('-password'); 
  response.status(200).json(users);
});

// GET /users/:id - Voir un utilisateur spécifique (Admin ou Propriétaire requis)
router.get("/:id", authenticate, isValidID, userExists, isOwnerOrAdmin, async (request, response) => {
  const user = await User.findById(request.params.id).select('-password');
  if (request.user.userRole !== 'admin' && request.user.userID.toString() !== request.params.id) {
        return response.status(401).json({ message: "Accès non autorisé à cet utilisateur." });
  }

  // Le mot de passe est déjà exclu par .select('-password')
  response.status(200).json(user);
});

// PUT /users/:id - Mettre à jour un utilisateur (Admin ou Propriétaire requis)
router.put("/:id", authenticate, isValidID, userExists, isOwnerOrAdmin, async (request, response) => {
  const id = request.params.id;
  const user = await User.findById(id).select('+password'); // On sélectionne le password pour la comparaison de l'email
  const newEmailUser = await User.findOne({ email: request.body.email});

  // Empêcher les utilisateurs non-admin de voir d'autres comptes (déjà géré par isOwnerOrAdmin, mais on vérifie encore ici)
  if (request.user.userRole !== 'admin' && request.user.userID.toString() !== id) {
        return response.status(401).json({ message: "Accès non autorisé à la modification de cet utilisateur." });
  }

  if (newEmailUser !== null && request.body.email !== user.email) {
    response.status(409).json({ message: "Email déjà existant, veuillez utiliser une autre adresse !" });
    return;
  }

  const updateData = request.body;
  
  // Empêcher les utilisateurs non-admin de changer leur rôle
  if (request.user.userRole !== "admin") { // Utilisation de request.user.userRole (JWT payload)
      delete updateData.role;
  }

  // Gérer la mise à jour du mot de passe (hachage automatique via hook mongoose)
  if (updateData.password) {
      // Le hook pre('save') dans bd.js hache le mot de passe avant l'enregistrement
      const updatedUser = await User.findByIdAndUpdate(
          id,
          { ...updateData }, // Mongoose et son hook gèrent le hachage
          { new: true, runValidators: true }
      ).select('-password'); 

      if (!updatedUser) {
        response.status(404).json({ message: "Utilisateur inexistant !" });
        return;
      }
      response.status(200).json({ message:`L'utilisateur ${id} a été modifié avec succès !` , user: updatedUser});
  } else {
      // Si aucun nouveau mot de passe, mettre à jour les autres champs normalement
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        response.status(404).json({ message: "Utilisateur inexistant !" });
        return;
      }
      response.status(200).json({ message:`L'utilisateur ${id} a été modifié avec succès !` , user: updatedUser});
  }
});


// DELETE /users/:id - Supprimer un utilisateur (Admin ou Propriétaire requis)
router.delete("/:id", authenticate, isValidID, userExists, isOwnerOrAdmin, async (request, response) => {
  const id = request.params.id;
  
  // Suppression
  const user = await User.findByIdAndDelete(id).select('-password'); 
  
  response.status(200).json({ message: `L'utilisateur ${id} a été supprimé avec succès !`, user });
});

export default router;