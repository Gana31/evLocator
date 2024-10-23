import { Router } from "express";
const router = Router();

import { farmerRegister, farmerLogin } from "../controllers/authContoller.js";

//-------------------Registration-------------------------

router.post("/register", farmerRegister);


//---------------------Login--------------------------

router.post("/login", farmerLogin);


export default router;
