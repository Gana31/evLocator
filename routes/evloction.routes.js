import { Router } from "express";
import {getNearbyEvDetails } from "../controllers/evlocatornearby.controller.js";
const evrouter = Router();

evrouter.get("/evloctionfinder", getNearbyEvDetails);




export default evrouter;
