import express from "express";
import { Restaurant, Menu } from "../bd.js"; 
// Import des middlewares JWT (isAdmin inclut authenticate)
import { isAdmin } from "../middlewares/authentication-middleware.js"; 
import mongoose from "mongoose"; 
// NOUVEL IMPORT de la validation Yup
import { validateRestaurant } from "../middlewares/validation-middleware.js"; 

const router = express.Router();

// Middleware de vérification d'ID
const isValidID = (request, response, next) => {
    if (!request.params.id || !mongoose.Types.ObjectId.isValid(request.params.id)) {
        return response.status(400).json({ message: "Le format de l'ID n'est pas valide." });
    }
    next();
};

// ===================================
// CRUD - READ (Public avec pagination/tri) - Conforme à "Public read access"
// ===================================

router.get("/", async (request, response) => {
    // ... (Logique de pagination et de tri inchangée)
    const { sort_by = 'name', sort_order = 'asc', page = 1, limit = 10 } = request.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    let sortField = {};
    if (['name', 'address'].includes(sort_by)) {
        sortField[sort_by] = sort_order === 'desc' ? -1 : 1;
    } else {
        sortField.name = 1;
    }

    try {
        const restaurants = await Restaurant.find()
            .sort(sortField)
            .skip(skip)
            .limit(limitNum);
        
        const totalCount = await Restaurant.countDocuments();

        response.status(200).json({
            data: restaurants,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalItems: totalCount
        });
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la récupération des restaurants.", error });
    }
});

router.get("/:id", isValidID, async (request, response) => {
    try {
        const restaurant = await Restaurant.findById(request.params.id);
        if (!restaurant) {
            return response.status(404).json({ message: "Restaurant introuvable." });
        }
        response.status(200).json(restaurant);
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la récupération du restaurant.", error });
    }
});


// ===================================
// CRUD - WRITE (Admin-only)
// ===================================

// POST /restaurants - Créer un restaurant (Admin requis, Validation requise)
router.post("/", isAdmin, validateRestaurant, async (request, response) => {
    try {
        const newRestaurant = new Restaurant(request.body);
        await newRestaurant.save();
        response.status(201).json({ message: "Restaurant créé avec succès.", restaurant: newRestaurant });
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "Un restaurant avec ce nom existe déjà." });
        }
        // Les erreurs de validation yup sont gérées par le middleware
        response.status(500).json({ message: "Erreur lors de la création du restaurant.", error });
    }
});

// PUT /restaurants/:id - Mettre à jour un restaurant (Admin requis, Validation requise)
router.put("/:id", isAdmin, isValidID, validateRestaurant, async (request, response) => {
    try {
        // L'option runValidators: true est importante pour utiliser les validations Mongoose (comme le unique index)
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            request.params.id,
            request.body,
            { new: true, runValidators: true } 
        );

        if (!updatedRestaurant) {
            return response.status(404).json({ message: "Restaurant introuvable." });
        }
        response.status(200).json({ message: "Restaurant mis à jour avec succès.", restaurant: updatedRestaurant });
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "Un restaurant avec ce nom existe déjà." });
        }
        response.status(500).json({ message: "Erreur lors de la mise à jour du restaurant.", error });
    }
});

// DELETE /restaurants/:id - Supprimer un restaurant (Admin requis)
router.delete("/:id", isAdmin, isValidID, async (request, response) => {
    try {
        const deletedRestaurant = await Restaurant.findByIdAndDelete(request.params.id);
        if (!deletedRestaurant) {
            return response.status(404).json({ message: "Restaurant introuvable." });
        }
        
        await Menu.deleteMany({ restaurant_id: request.params.id }); 

        response.status(200).json({ message: "Restaurant et menus associés supprimés avec succès." });
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la suppression du restaurant.", error });
    }
});

export default router;