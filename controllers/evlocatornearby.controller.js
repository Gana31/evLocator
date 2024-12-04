import catchAsyncError from "../utils/catchAsyncError.js";
import dotenv from "dotenv";

dotenv.config();

export const getNearbyEvDetails = catchAsyncError(async (req, res, next) => {
  const lat = 18.5204; // Latitude of Pune
  const lon = 73.8567; // Longitude of Pune
  const radius = 5000; // 5km radius
  const maxResults = 10; // Limiting to 10 places

  try {
    const requestBody = {
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lon
          },
          radius: radius
        }
      },
      includedTypes: ["electric_vehicle_charging_station"],
      maxResultCount: maxResults
    };

    const searchResponse = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.evChargeOptions,places.googleMapsLinks,places.id"
      },
      body: JSON.stringify(requestBody)
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok || !searchData.places || searchData.places.length === 0) {
      return res.status(400).send({
        message: "No EV charging stations found nearby",
        success: false,
        error: searchData.error || "No results"
      });
    }

    const placeDetailsPromises = searchData.places.map(async (place) => {
      const placeId = place.id;

      const detailsResponse = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.googleMapsLinks,places.evChargeOptions,places.evChargeOptions.connectorTypes,places.evChargeOptions.chargingAvailability,places.evChargeOptions.voltage,places.evChargeOptions.powerOutput,places.evChargeOptions.chargingFee,places.evChargeOptions.acOrDc,places.evChargeOptions.fastCharging"
        }
      });

      const detailsData = await detailsResponse.json();

      const chargeOptions = detailsData.places?.evChargeOptions?.map((option) => ({
        connectorType: option.connectorTypes?.join(", "),
        voltage: option.voltage,
        powerOutput: option.powerOutput,
        chargingFee: option.chargingFee,
        acOrDc: option.acOrDc,
        fastCharging: option.powerOutput >= 50 ? "Yes" : "No", // Fast charging if power output is 50 kW or more
        inUse: option.chargingAvailability?.currentlyUsedCount || 0, // Currently used slots
        totalSlots: option.chargingAvailability?.totalCount || 0, // Total available slots
        nextAvailability: option.chargingAvailability?.nextAvailableTime || "Unknown" // When the charger will become available
      })) || [];

      return {
        ...place,
        details: {
          displayName: detailsData.places?.displayName,
          formattedAddress: detailsData.places?.formattedAddress,
          googleMapsLinks: detailsData.places?.googleMapsLinks,
          chargeOptions
        }
      };
    });

    const detailedResults = await Promise.all(placeDetailsPromises);

    res.status(200).send({
      message: "EV charging stations fetched successfully",
      success: true,
      data: detailedResults
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch EV charging station details",
      success: false,
      error: error.message
    });
  }
});
