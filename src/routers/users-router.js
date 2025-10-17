import express from "express";
import bcrypt from "bcrypt";

import { User } from "../bd.js"; 
import { isAdmin, isOwnerOrAdmin, authenticate } from "../middlewares/authentication-middleware.js"; 
import { isValidID, userExists } from "../middlewares/params-middleware.js";
// NOUVEL IMPORT des middlewares de validation Yup
import { validateUser, validateUserUpdate } from "../middlewares/validation-middleware.js"; //

const router = express.Router();

// ===================================
// CRUD - CREATE (Inscription - Public) - Conforme à "Users can create accounts without authentication."
// ===================================
// POST /users - Inscription utilisateur
router.post("/", validateUser, async (request, response) => { // Ajout de validateUser
    try {
        const newUser = new User({ 
            email: request.body.email,
            username: request.body.username,
            password: request.body.password,
            role: 'user' // Force le rôle à 'user' pour toutes les inscriptions publiques.
        });

        await newUser.save();

        const userResponse = { id: newUser._id, email: newUser.email, username: newUser.username, role: newUser.role };
        response.status(201).json({ message: `Bienvenue ${newUser.username}, ton compte a été créé avec succès.`, user: userResponse });
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "Email déjà existant, veuillez utiliser une autre adresse !" });
        }
        response.status(500).json({ message: "Erreur lors de l'inscription.", error: error.message });
    }
});


// ===================================
// CRUD - READ 
// ===================================

// GET /users - Lister tous les utilisateurs (Admin requis)
router.get("/", authenticate, isAdmin, async (request, response) => {
  const users = await User.find().select('-password'); 
  response.status(200).json(users);
});

// GET /users/me - Obtenir les détails de l'utilisateur actuel (via JWT ID)
// Remplace l'ancienne route /my_account
router.get("/me", authenticate, async (request, response) => { //
  try {
    const user = await User.findById(request.user.userID).select('-password'); 

    if (!user) {
        return response.status(404).json({ message: "Utilisateur introuvable." }); 
    }
    
    response.status(200).json(user);
  } catch (error) {
    response.status(500).json({ message: "Erreur lors de la récupération du compte.", error });
  }
});


// GET /users/:id - Voir un utilisateur spécifique (Admin ou Propriétaire requis)
router.get("/:id", authenticate, isValidID, userExists, isOwnerOrAdmin, async (request, response) => {
  const user = await User.findById(request.params.id).select('-password');
  // La vérification d'autorisation est gérée par isOwnerOrAdmin.
  
  response.status(200).json(user);
});


// ===================================
// CRUD - UPDATE/DELETE (Propriétaire ou Admin requis)
// ===================================

// PUT /users/:id - Mettre à jour un utilisateur (Admin ou Propriétaire requis, Validation requise)
router.put("/:id", authenticate, isValidID, userExists, isOwnerOrAdmin, validateUserUpdate, async (request, response) => { // Ajout de validateUserUpdate
  const id = request.params.id;
  const user = await User.findById(id).select('+password'); 
  
  // Vérification de l'email unique lors de la mise à jour
  if (request.body.email && request.body.email !== user.email) {
    const newEmailUser = await User.findOne({ email: request.body.email});
    if (newEmailUser !== null) {
        return response.status(409).json({ message: "Email déjà existant, veuillez utiliser une autre adresse !" });
    }
  }

  const updateData = request.body;
  
  // Empêcher les utilisateurs non-admin de changer leur rôle
  if (request.user.userRole !== "admin") { 
      delete updateData.role;
  }

  // Le hook pre('save') dans db.js gère le hachage du nouveau mot de passe (s'il est fourni)
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
});


// DELETE /users/:id - Supprimer un utilisateur (Admin ou Propriétaire requis)
router.delete("/:id", authenticate, isValidID, userExists, isOwnerOrAdmin, async (request, response) => {
  const id = request.params.id;
  
  // Suppression
  const user = await User.findByIdAndDelete(id).select('-password'); 
  
  response.status(200).json({ message: `L'utilisateur ${id} a été supprimé avec succès !`, user });
});

export default router;