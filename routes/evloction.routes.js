import { Router } from "express";
import {bookSlot, getAllBookings, getAvailableSlots} from "../controllers/evlocatornearby.controller.js";
import { auth } from "../middlewares/authMiddleware.js";
const evrouter = Router();

// evrouter.get("/evloctionfinder", getNearbyEvDetails);
evrouter.post("/book",auth,bookSlot);

// Route for fetching available slots
evrouter.get("/available", getAvailableSlots);


evrouter.get("/getallbookings", auth, getAllBookings);

export default evrouter;
