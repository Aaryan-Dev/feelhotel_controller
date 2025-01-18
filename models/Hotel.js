const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
  hotel_id: Number,
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

module.exports = mongoose.model("Hotel", hotelSchema);