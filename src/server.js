import express from "express";

// import session from "express-session"; // <-- Suppression de l'import

import usersRouter from "./routers/users-router.js";
import authenticationRouter from "./routers/authentification-router.js";
import myAccountRouter from "./routers/my-account-router.js";
import restaurantsRouter from "./routers/restaurants-router.js"; 
import menusRouter from "./routers/menus-router.js"; 

const app = express();

app.use(express.json());

// app.use(session({ // <-- Suppression du middleware de session
//     secret: "secret"
// }));

app.use("/users", usersRouter);
app.use("/authentification", authenticationRouter);
app.use("/my_account", myAccountRouter);
app.use("/restaurants", restaurantsRouter); 
app.use("/menus", menusRouter);

export default app;