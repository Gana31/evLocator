import mongoose from "mongoose";

const slotBookingSchema = new mongoose.Schema({
  stationId: {
    type: String, // ID of the EV station provided by the frontend
    required: true,
  },
  stationImage: {
    type: String, // ID of the EV station provided by the frontend
    required: true,
  },
  stationName: {
    type: String, // ID of the EV station provided by the frontend
    required: true,
  },
  connectorId: {
    type: String, // Connector ID provided by the frontend
    required: true,
  },
  date: {
    type: Date, // Booking date
    required: true,
  },
  startTime: {
    type: String, // Start time in 24-hour format (e.g., "10:00")
    required: true,
  },
  endTime: {
    type: String, // End time in 24-hour format (e.g., "12:00")
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the user making the booking
    required: true,
  },
});


const slotbookingmodel = mongoose.model("SlotBooking", slotBookingSchema);

export default slotbookingmodel;
