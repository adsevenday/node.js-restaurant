import express from "express";
import { Menu } from "../bd.js";
import { isAdmin } from "../middlewares/authentication-middleware.js"; 
import mongoose from "mongoose"; 
// NOUVEL IMPORT de la validation Yup
import { validateMenu } from "../middlewares/validation-middleware.js"; 

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

// GET /menus - Liste des menus (Public, avec tri et pagination)
router.get("/", async (request, response) => {
    // ... (Logique de pagination et de tri inchangée)
    const { sort_by = 'name', sort_order = 'asc', page = 1, limit = 10, restaurant_id } = request.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    let filter = {};
    if (restaurant_id && mongoose.Types.ObjectId.isValid(restaurant_id)) {
        filter.restaurant_id = restaurant_id;
    }

    let sortField = {};
    if (['price', 'category', 'name'].includes(sort_by)) {
        sortField[sort_by] = sort_order === 'desc' ? -1 : 1;
    } else {
        sortField.name = 1;
    }

    try {
        const menus = await Menu.find(filter)
            .sort(sortField)
            .skip(skip)
            .limit(limitNum)
            .populate('restaurant_id', 'name'); 

        const totalCount = await Menu.countDocuments(filter);

        response.status(200).json({
            data: menus,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalItems: totalCount
        });
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la récupération des menus.", error });
    }
});

router.get("/:id", isValidID, async (request, response) => {
    try {
        const menu = await Menu.findById(request.params.id).populate('restaurant_id', 'name');
        if (!menu) {
            return response.status(404).json({ message: "Menu introuvable." });
        }
        response.status(200).json(menu);
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la récupération du menu.", error });
    }
});

// ===================================
// CRUD - WRITE (Admin-only)
// ===================================

// POST /menus - Créer un menu (Admin requis, Validation requise)
router.post("/", isAdmin, validateMenu, async (request, response) => {
    try {
        const newMenu = new Menu(request.body);
        await newMenu.save();
        response.status(201).json({ message: "Menu créé avec succès.", menu: newMenu });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return response.status(400).json({ message: "Erreur de validation des données Mongoose.", details: error.message });
        }
        response.status(500).json({ message: "Erreur lors de la création du menu.", error });
    }
});

// PUT /menus/:id - Mettre à jour un menu (Admin requis, Validation requise)
router.put("/:id", isAdmin, isValidID, validateMenu, async (request, response) => {
    try {
        const updatedMenu = await Menu.findByIdAndUpdate(
            request.params.id,
            request.body,
            { new: true, runValidators: true }
        );

        if (!updatedMenu) {
            return response.status(404).json({ message: "Menu introuvable." });
        }
        response.status(200).json({ message: "Menu mis à jour avec succès.", menu: updatedMenu });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return response.status(400).json({ message: "Erreur de validation des données Mongoose.", details: error.message });
        }
        response.status(500).json({ message: "Erreur lors de la mise à jour du menu.", error });
    }
});

// DELETE /menus/:id - Supprimer un menu (Admin requis)
router.delete("/:id", isAdmin, isValidID, async (request, response) => {
    try {
        const deletedMenu = await Menu.findByIdAndDelete(request.params.id);
        if (!deletedMenu) {
            return response.status(404).json({ message: "Menu introuvable." });
        }
        response.status(200).json({ message: "Menu supprimé avec succès." });
    } catch (error) {
        response.status(500).json({ message: "Erreur lors de la suppression du menu.", error });
    }
});

export default router;