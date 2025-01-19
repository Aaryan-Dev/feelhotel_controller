const { graphql } = require("graphql");
const schema = require("./schema"); /
const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Mocking the models
jest.mock("../models/User");
jest.mock("../models/Booking");
jest.mock("../models/Hotel");

describe("GraphQL Mutations and Queries", () => {
  let user;
  let hotel;

  beforeEach(() => {
    // Mock data for user and hotel
    user = {
      id: "1",
      email: "test@example.com",
      password: "hashedPassword",
    };

    hotel = {
      hotel_id: 1,
      hotel_name: "Test Hotel",
      chain_name: "Test Chain",
      city: "Test City",
      country: "Test Country",
      star_rating: 5,
      latitude: 10.123,
      longitude: 20.123,
      photo1: "photo_url",
      overview: "A test hotel",
      rates_from: 100,
      rates_currency: "USD",
    };

    // Mock User.findOne to return the mock user
    User.findOne.mockResolvedValue(user);

    // Mock Hotel.findOne to return the mock hotel
    Hotel.findOne.mockResolvedValue(hotel);
  });

  test("should sign up a user", async () => {
    const query = `
      mutation {
        signUp(email: "test@example.com", password: "password123") {
          id
          email
          token
        }
      }
    `;

    const response = await graphql(schema, query);

    expect(response.data.signUp.id).toBe("1");
    expect(response.data.signUp.email).toBe("test@example.com");
    expect(response.data.signUp.token).toBeDefined();
  });

  test("should return an error if user already exists during signUp", async () => {
    // Simulate that the user already exists
    User.findOne.mockResolvedValue(user);

    const query = `
      mutation {
        signUp(email: "test@example.com", password: "password123") {
          id
          email
          token
        }
      }
    `;

    const response = await graphql(schema, query);

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe("User already exists");
  });

  test("should sign in a user", async () => {
    // Mock password comparison to always return true
    bcrypt.compare.mockResolvedValue(true);

    const query = `
      mutation {
        signIn(email: "test@example.com", password: "password123") {
          id
          email
          token
        }
      }
    `;

    const response = await graphql(schema, query);

    expect(response.data.signIn.id).toBe("1");
    expect(response.data.signIn.email).toBe("test@example.com");
    expect(response.data.signIn.token).toBeDefined();
  });

  test("should return error if credentials are invalid during signIn", async () => {
    // Mock password comparison to return false (invalid credentials)
    bcrypt.compare.mockResolvedValue(false);

    const query = `
      mutation {
        signIn(email: "test@example.com", password: "wrongPassword") {
          id
          email
          token
        }
      }
    `;

    const response = await graphql(schema, query);

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe("Invalid credentials");
  });

  test("should book a hotel", async () => {
    const query = `
      mutation {
        bookHotel(hotel_id: 1, email: "test@example.com", booking_date: "2025-01-19") {
          id
          hotel_id
          email
          booking_date
        }
      }
    `;

    // Mock booking saving
    Booking.prototype.save.mockResolvedValue({
      id: "1",
      hotel_id: 1,
      email: "test@example.com",
      booking_date: "19-01-25", // Format as per mutation logic
    });

    const response = await graphql(schema, query);

    expect(response.data.bookHotel.id).toBe("1");
    expect(response.data.bookHotel.hotel_id).toBe(1);
    expect(response.data.bookHotel.email).toBe("test@example.com");
    expect(response.data.bookHotel.booking_date).toBe("19-01-25");
  });

  test("should return error if hotel not found during booking", async () => {
    Hotel.findOne.mockResolvedValue(null); // Simulate hotel not found

    const query = `
      mutation {
        bookHotel(hotel_id: 1, email: "test@example.com", booking_date: "2025-01-19") {
          id
          hotel_id
          email
          booking_date
        }
      }
    `;

    const response = await graphql(schema, query);

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe("Hotel not found");
  });

  test("should return error if booking already exists", async () => {
    // Mock existing booking
    Booking.findOne.mockResolvedValue({
      hotel_id: 1,
      email: "test@example.com",
      booking_date: "19-01-25",
    });

    const query = `
      mutation {
        bookHotel(hotel_id: 1, email: "test@example.com", booking_date: "2025-01-19") {
          id
          hotel_id
          email
          booking_date
        }
      }
    `;

    const response = await graphql(schema, query);

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe(
      "Booking already exists for the selected date"
    );
  });

  test("should return bookings for a user", async () => {
    const query = `
      query {
        getBookedHotels(email: "test@example.com") {
          id
          hotel_id
          booking_date
        }
      }
    `;

    // Mock booking data
    Booking.find.mockResolvedValue([
      {
        id: "1",
        hotel_id: 1,
        booking_date: "19-01-25",
      },
    ]);

    const response = await graphql(schema, query);

    expect(response.data.getBookedHotels.length).toBe(1);
    expect(response.data.getBookedHotels[0].hotel_id).toBe(1);
  });

  test("should return error if no bookings found for a user", async () => {
    const query = `
      query {
        getBookedHotels(email: "test@example.com") {
          id
          hotel_id
          booking_date
        }
      }
    `;

    // Simulate no bookings found
    Booking.find.mockResolvedValue([]);

    const response = await graphql(schema, query);

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe("No bookings found for this email");
  });
});
