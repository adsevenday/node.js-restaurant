import jwt from 'jsonwebtoken';

// Clé secrète pour signer/vérifier les JWTs. 
// À remplacer par une variable d'environnement forte !
const JWT_SECRET = 'votre_super_clé_secrete'; 

// Middleware pour décoder le token et stocker les infos dans request.user
export function authenticateJWT() {
    return (request, response, next) => {
        const authHeader = request.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(' ')[1]; // Format: Bearer TOKEN

            jwt.verify(token, JWT_SECRET, (error, user) => {
                if (error) {
                    // Token invalide ou expiré
                    return response.status(403).json({ message: "Token non valide ou expiré." });
                }
                // Stocke les données décodées (id et role) dans l'objet request
                request.user = user; 
                next();
            });
        } else {
            // Aucun token fourni
            return response.status(401).json({ message: "Accès refusé. Token manquant." });
        }
    };
}

// Middleware pour vérifier l'authentification (rôle Admin)
export function isValidAdmin() {
    return (request, response, next) => {
        // Vérifie si les données utilisateur sont dans la requête et si le rôle est 'admin'
        if (request.user && request.user.userRole === "admin") {
            next();
        } else {
            response.status(401).json({ message: "Vous n'avez pas les autorisations nécessaires (Admin requis) !" });
        }
    };
}

// Middleware pour vérifier si un utilisateur est connecté (équivalent de isLogged)
export function isAuthenticated() {
  return (request, response, next) => {
    if (!request.user || !request.user.userID) {
      response.status(401).json({ message: "Aucun utilisateur connecté (Token invalide ou manquant) !" });
      return;
    } else {
      next();
    }
  };
}


// Middleware pour vérifier si l'utilisateur est 'admin' OU le propriétaire de la ressource (:id)
export function isValidOwnerOrAdmin() {
    return (request, response, next) => {
        // 1. Doit être authentifié (request.user doit exister)
        if (!request.user || !request.user.userID) {
            return response.status(401).json({ message: "Authentification requise." });
        }

        const loggedInUserID = request.user.userID.toString();
        const targetResourceID = request.params.id;
        const loggedInUserRole = request.user.userRole;

        // 2. Vérification du rôle Admin
        if (loggedInUserRole === "admin") {
            next();
            return;
        }

        // 3. Vérification du Propriétaire
        // L'ID dans le token (userID) doit correspondre à l'ID de la ressource dans l'URL (:id)
        if (loggedInUserID === targetResourceID) {
            next();
            return;
        }

        // 4. Accès refusé
        response.status(401).json({ message: "Vous n'avez pas les autorisations nécessaires (Admin ou Propriétaire requis) !" });
    };
}

// Exportation des constantes de middleware
export const isOwnerOrAdmin = isValidOwnerOrAdmin();
export const isAdmin = isValidAdmin();
export const isAuthenticatedMiddleware = [authenticateJWT(), isAuthenticated()]; 
export const authenticate = authenticateJWT(); // Utilisé juste pour décoder, sans vérifier l'existence