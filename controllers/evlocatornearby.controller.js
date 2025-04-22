import catchAsyncError from "../utils/catchAsyncError.js";
import dotenv from "dotenv";
import ErrorHandler from "../utils/errorHandler.js";
import slotbookingmodel from "../models/evstation.js";
dotenv.config();

export const bookSlot = catchAsyncError(async (req, res, next) => {
  try {
    const { connectorId, date, startTime, endTime ,stationId,stationName,stationImage} = req.body;
    // console.log(req.body);
    // Convert the input date to a Date object (ensure it’s in the local time zone)
    const [day, month, year] = date.split('-').map(Number);
    const bookingDate = new Date(Date.UTC(year, month - 1, day)); // Month is 0-indexed

    // Extract the start and end time in minutes
    const bookingTimeStart = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
    const bookingTimeEnd = parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);

    // Get the current date and time
    const currentDate = new Date();
    const localMidnight = new Date(currentDate);
    localMidnight.setHours(0, 0, 0, 0); // Set time to today's midnight

    // Check if booking is for today and in the past
    const isSameDate =
      bookingDate.getUTCFullYear() === currentDate.getFullYear() &&
      bookingDate.getUTCMonth() === currentDate.getMonth() &&
      bookingDate.getUTCDate() === currentDate.getDate();

    if (isSameDate && bookingTimeStart <= (currentDate.getHours() * 60 + currentDate.getMinutes())) {
      return next(new ErrorHandler("You cannot book a past time slot.", 400));
    }

    // Check for overlapping slot
    const overlappingSlots = await slotbookingmodel.find({
      stationId,
      connectorId,
      date: bookingDate,
      startTime,
      endTime,
    });

    if (overlappingSlots.length > 0) {
      return next(new ErrorHandler("The selected time slot is unavailable for this connector.", 400));
    }

    // Create the slot
    const newSlot = await slotbookingmodel.create({
      stationId,
      connectorId,
      date: bookingDate,
      startTime,
      endTime,
      stationName,
      stationImage,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Slot booked successfully",
      slot: newSlot,
    });
  } catch (error) {
    console.log("Error during slot booking:", error);

    if (error instanceof ErrorHandler) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message || error,
    });
  }
});

export const getAvailableSlots = catchAsyncError(async (req, res, next) => {
  try {
    const { stationId, connectorId } = req.query;

  // Validate input
  if (!stationId || !connectorId) {
    return next(new ErrorHandler("Station ID and Connector ID are required.", 400));
  }

  // Predefined time slots
  const timeSlots = [
    "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM",
    "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM", "08:00 PM - 09:00 PM",
    "09:00 PM - 10:00 PM"
  ];

  const currentDateTime = new Date();

  // Helper to convert a date to YYYY-DD-MM format
  const toYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = toYYYYMMDD(currentDateTime); // Format: YYYY-DD-MM
  const currentTimeInMinutes = currentDateTime.getHours() * 60 + currentDateTime.getMinutes();

  // Get tomorrow's date
  const tomorrowDate = new Date(currentDateTime);
  tomorrowDate.setDate(currentDateTime.getDate() + 1);
  const tomorrowDateString = toYYYYMMDD(tomorrowDate); // Format: YYYY-DD-MM

  // console.log("Today's Date:", todayDate);
  // console.log("Tomorrow's Date:", tomorrowDateString);

  // Fetch bookings for today and tomorrow using date comparison
  const bookings = await slotbookingmodel.find({
    stationId,
    connectorId,
    date: {
      $gte: new Date(todayDate + "T00:00:00.000Z"), // Start of today
      $lt: new Date(tomorrowDateString +  "T23:59:59.999Z") // Start of tomorrow
    }
  });

  // console.log("Bookings for today and tomorrow:", bookings);

  // Helper to convert time strings to minutes
  const timeStringToMinutes = (time) => {
    const [timeWithoutPeriod, period] = time.split(" ");
    const [hours, minutes] = timeWithoutPeriod.split(":").map(Number);
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period === "PM" && hours !== 12) totalMinutes += 720; // Add 12 hours for PM times
    if (period === "AM" && hours === 12) totalMinutes -= 720; // Handle midnight (12:00 AM)
    return totalMinutes;
  };

  // Convert time slots to a structured format
  const timeSlotsInMinutes = timeSlots.map(slot => {
    const [start, end] = slot.split(" - ");
    return {
      slot,
      startTimeInMinutes: timeStringToMinutes(start),
      endTimeInMinutes: timeStringToMinutes(end)
    };
  });

  // Helper function to get available slots for a day
  const getAvailableSlotsForDay = (bookings, date, isToday = false) => {
    const bookedSlots = bookings.filter(booking => {
      // Compare only the date part in YYYY-DD-MM format
      return booking.date.toISOString().split("T")[0] === date;
    });

    const bookedTimeRanges = bookedSlots.map(booking => ({
      startTimeInMinutes: timeStringToMinutes(booking.startTime),
      endTimeInMinutes: timeStringToMinutes(booking.endTime)
    }));

    // Filter out slots that overlap with bookings or are in the past (for today)
    return timeSlotsInMinutes.filter(slot => {
      const { startTimeInMinutes, endTimeInMinutes } = slot;

      // Skip past slots for today
      if (isToday && startTimeInMinutes <= currentTimeInMinutes) {
        return false;
      }

      // Check if the slot is overlapping with any booked slot
      const isOverlapping = bookedTimeRanges.some(booking => {
        return (
          startTimeInMinutes < booking.endTimeInMinutes &&
          endTimeInMinutes > booking.startTimeInMinutes
        );
      });

      return !isOverlapping;
    });
  };

  // Get available slots for today and tomorrow
  const availableSlots = {
    today: getAvailableSlotsForDay(bookings, todayDate, true),
    tomorrow: getAvailableSlotsForDay(bookings, tomorrowDateString)
  };

  // Respond with the available slots
  res.status(200).json({
    success: true,
    availableSlots,
    today: todayDate,
    tomorrow: tomorrowDateString
  });
    
  } catch (error) {
    // console.error("Error fetching booking slot:", error);

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching booking slot.",
      error: error.message || error,
    });
  
    
  }
});




export const getAllBookings = catchAsyncError(async (req, res, next) => {
  try {
    // Extract userId from the authenticated user
    const userId = req.user.id;

    // Fetch all bookings for the authenticated user, sorted by date and time in descending order
    const bookings = await slotbookingmodel
      .find({ userId })
      .sort({ date: -1, startTime: -1 }); // Sort by date and time in descending order

    // Check if there are bookings
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found.",
      });
    }
    // console.log(bookings);
    // Send the sorted bookings as the response
    res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully.",
      bookings,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching booking details.",
      error: error.message || error,
    });
  }
});



export const updatetheBooking = catchAsyncError(async (req, res, next) => {
  try {
    // Extract userId from the authenticated user (assuming user is authenticated)
    const userId = req.user.id;
    
    // Extract the bookingId from URL parameters
    const {id} = req.params;
    
    // Extract the new startTime from the request body (e.g., "12:00 PM - 01:00 PM")
    const { startTime } = req.body;

    // Split the startTime into start and end times
    const [newStartTime, newEndTime] = startTime.split(' - ');

    // console.log("Booking ID:", id);
    // console.log("New Start Time:", newStartTime);
    // console.log("New End Time:", newEndTime);
    
    // Find the booking by bookingId and userId (assuming you want to update only the user's bookings)
    const booking = await slotbookingmodel.findOne({ 
      _id: id, 
      userId: userId 
    });

    // If the booking is not found, return an error
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Update the startTime and endTime of the found booking
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;

    // Save the updated booking back to the database
    await booking.save();

    // Send a success response
    res.status(200).json({
      success: true,
      message: "Booking updated successfully.",
      booking,
    });
    
  } catch (error) {
    console.error("Error updating booking:", error);

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the booking.",
      error: error.message || error,
    });
  }
});


export const deletetheBooking = catchAsyncError(async (req, res, next) => {
  try {
    // Extract userId from the authenticated user
    const userId = req.user.id;
    
    // Extract booking ID from the URL parameters
    const { id } = req.params;
    
    // console.log("Booking ID to delete:", id);

    // Find the booking by its ID and userId (to ensure that the booking belongs to the authenticated user)
    const booking = await slotbookingmodel.findOne({
      _id: id, 
      userId: userId,
    });

    // If no booking is found, return an error
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or does not belong to the user.",
      });
    }

    // Delete the booking
    await booking.deleteOne();

    // Send success response
    res.status(200).json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the booking.",
      error: error.message || error,
    });
  }
});
