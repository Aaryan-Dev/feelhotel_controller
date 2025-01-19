const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLFloat,
} = require("graphql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

// User Type
const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    email: { type: GraphQLString },
    token: { type: GraphQLString },
  }),
});

// Hotel Type
const HotelType = new GraphQLObjectType({
  name: "Hotel",
  fields: () => ({
    hotel_id: { type: GraphQLInt },
    chain_name: { type: GraphQLString },
    hotel_name: { type: GraphQLString },
    city: { type: GraphQLString },
    country: { type: GraphQLString },
    star_rating: { type: GraphQLFloat },
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    photo1: { type: GraphQLString },
    overview: { type: GraphQLString },
    rates_from: { type: GraphQLInt },
    rates_currency: { type: GraphQLString },
  }),
});

// Booking Type
const BookingType = new GraphQLObjectType({
  name: "Booking",
  fields: () => ({
    id: { type: GraphQLString },
    hotel_id: { type: GraphQLInt },
    email: { type: GraphQLString },
    booking_date: { type: GraphQLString },
  }),
});

// Mutations for SignIn and SignUp
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    signUp: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      async resolve(parent, args) {
        const { email, password } = args;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.log("existingUser", existingUser);
          throw new Error("User already exists");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        return {
          id: newUser.id,
          email: newUser.email,
          token,
        };
      },
    },
    signIn: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      async resolve(parent, args) {
        const { email, password } = args;

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("User not found");
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new Error("Invalid credentials");
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        return {
          id: user.id,
          email: user.email,
          token,
        };
      },
    },
    bookHotel: {
      type: BookingType,
      args: {
        hotel_id: { type: new GraphQLNonNull(GraphQLInt) }, // Hotel ID is required
        email: { type: new GraphQLNonNull(GraphQLString) }, // Email is required
        booking_date: { type: new GraphQLNonNull(GraphQLString) }, // Booking date is required
      },
      async resolve(_, { hotel_id, email, booking_date }) {
        // Check if the hotel exists
        const hotel = await Hotel.findOne({ hotel_id });
        if (!hotel) {
          throw new Error("Hotel not found");
        }

        // Check if a booking already exists for this hotel_id and booking_date
        const existingBooking = await Booking.findOne({
          hotel_id,
          booking_date: new Date(booking_date),
        });

        if (existingBooking) {
          throw new Error("Booking already exists for the selected date");
        }

        // Create a new booking
        const booking = new Booking({
          hotel_id,
          email,
          booking_date: new Date(booking_date),
          chain_name: hotel.chain_name,
          hotel_name: hotel.hotel_name,
          city: hotel.city,
          country: hotel.country,
          star_rating: hotel.star_rating,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          photo1: hotel.photo1,
          overview: hotel.overview,
          rates_from: hotel.rates_from,
          rates_currency: hotel.rates_currency,
        });

        return await booking.save();
      },
    },
  },
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    hello: {
      type: GraphQLString,
      resolve() {
        return "Welcome to the GraphQL Authentication Server!";
      },
    },
    bookings: {
      type: new GraphQLList(BookingType),
      resolve() {
        return Booking.find();
      },
    },
     hotels: {
      type: new GraphQLList(HotelType), // Returning a list of hotels
      resolve() {
        return Hotel.find(); // Fetch all hotels from MongoDB
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
