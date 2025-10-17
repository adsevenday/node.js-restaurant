import express from "express";

import usersRouter from "./routers/users-router.js";
import authenticationRouter from "./routers/authentification-router.js";
// import myAccountRouter from "./routers/my-account-router.js"; // L'ancienne route /my_account est maintenant /users/me

import restaurantsRouter from "./routers/restaurants-router.js"; 
import menusRouter from "./routers/menus-router.js"; 

const app = express();

app.use(express.json());

app.use("/users", usersRouter);
app.use("/authentification", authenticationRouter); // Gardé pour le /login
// app.use("/my_account", myAccountRouter); // Suppression de la référence
app.use("/restaurants", restaurantsRouter); 
app.use("/menus", menusRouter);

export default app;