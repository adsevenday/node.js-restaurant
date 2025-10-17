import * as yup from 'yup';
import mongoose from 'mongoose';

// Middleware générique de validation
const validate = (schema) => async (request, response, next) => {
    try {
        await schema.validate(request.body, { abortEarly: false });
        next();
    } catch (error) {
        // Formatte les erreurs pour un retour client clair
        response.status(400).json({ 
            message: "Erreur de validation des données.", 
            errors: error.errors 
        });
    }
};

// ===================================
// Schémas de validation
// ===================================

// Schéma Utilisateur (Inscription: rôle est forcé à 'user' dans le router, pas de 'role' en entrée)
const userSchema = yup.object({
    email: yup.string().email("L'email doit être valide.").required("L'email est requis."),
    username: yup.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.").required("Le nom d'utilisateur est requis."),
    password: yup.string().min(6, "Le mot de passe doit contenir au moins 6 caractères.").required("Le mot de passe est requis."),
});

// Schéma de Mise à jour Utilisateur (les champs sont optionnels, mais au moins un doit être présent)
const userUpdateSchema = yup.object({
    email: yup.string().email("L'email doit être valide.").optional(),
    username: yup.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.").optional(),
    password: yup.string().min(6, "Le mot de passe doit contenir au moins 6 caractères.").optional(),
    // Seul un Admin peut potentiellement mettre à jour le rôle
    role: yup.string().oneOf(['user', 'admin'], "Le rôle doit être 'user' ou 'admin'.").optional(), 
}).test(
    'at-least-one-field',
    "Au moins un champ (email, username, password, role) doit être fourni pour la mise à jour.",
    (obj) => obj.email || obj.username || obj.password || obj.role
);

// Schéma Restaurant (Champs requis)
const restaurantSchema = yup.object({
    name: yup.string().min(2, "Le nom doit contenir au moins 2 caractères.").required("Le nom du restaurant est requis."),
    address: yup.string().required("L'adresse est requise."),
    phone: yup.string().required("Le numéro de téléphone est requis."),
    opening_hours: yup.string().required("Les heures d'ouverture sont requises."),
});

// Schéma Menu (restaurant_id doit être un ObjectId valide, le check de l'existence du restaurant est fait dans le router)
const menuSchema = yup.object({
    restaurant_id: yup.string()
        .required("L'ID du restaurant est requis.")
        .test('is-mongo-id', "L'ID du restaurant doit être un ID MongoDB valide.", (value) => mongoose.Types.ObjectId.isValid(value)),
    name: yup.string().min(2, "Le nom doit contenir au moins 2 caractères.").required("Le nom du menu est requis."),
    description: yup.string().optional(),
    price: yup.number().min(0, "Le prix ne peut pas être négatif.").required("Le prix est requis."),
    category: yup.string().required("La catégorie est requise."),
});

// ===================================
// Exportation des middlewares
// ===================================

export const validateUser = validate(userSchema);
export const validateUserUpdate = validate(userUpdateSchema);
export const validateRestaurant = validate(restaurantSchema);
export const validateMenu = validate(menuSchema);