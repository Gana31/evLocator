import { Router } from "express";
const router = Router();

import { farmerRegister, farmerLogin, updateProfile } from "../controllers/authContoller.js";
import { auth } from "../middlewares/authMiddleware.js";

//-------------------Registration-------------------------

router.post("/register", farmerRegister);


//---------------------Login--------------------------

router.post("/login", farmerLogin);

router.put("/updateProfile",auth, updateProfile)



export default router;
