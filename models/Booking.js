const mongoose = require("mongoose");

// Booking Schema
const bookingSchema = new mongoose.Schema({
  hotel_id: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  booking_date: {
    type: String,
    required: true,
  },
  chain_name: String,
  hotel_name: String,
  city: String,
  country: String,
  star_rating: Number,
  latitude: Number,
  longitude: Number,
  photo1: String,
  overview: String,
  rates_from: Number,
  rates_currency: String,
});

module.exports = mongoose.model("Booking", bookingSchema);
