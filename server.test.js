const request = require("supertest");
const mongoose = require("mongoose");
const app = require("./server"); 
const mockingoose = require("mockingoose");
const User = require("../models/User");
const Hotel = require("../models/Hotel");

// Mock MongoDB connection (Optional for testing)
jest.mock("mongoose", () => ({
  connect: jest.fn(),
  connection: {
    readyState: 1, // Simulating MongoDB connection state (1 = connected)
  },
}));

describe("Express GraphQL API", () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockingoose.resetAll();
  });

  test("should connect to MongoDB and run server", async () => {
    // Simulate a server request to see if the connection and server are up
    const response = await request(app).get("/graphql");
    expect(response.status).toBe(200);
  });

  test("should respond with GraphiQL interface when accessing /graphql", async () => {
    // Check if GraphiQL is enabled
    const response = await request(app).get("/graphql");
    expect(response.status).toBe(200);
    expect(response.text).toContain("<html>"); // GraphiQL interface returns HTML
  });

  test("should return an error when using invalid GraphQL query", async () => {
    const query = `
      query {
        invalidQuery {
          field
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      'Cannot query field "invalidQuery" on type "RootQueryType".'
    );
  });

  test("should successfully get data from valid GraphQL query", async () => {
    const query = `
      query {
        hello
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body.data.hello).toBe(
      "Welcome to the GraphQL Authentication Server!"
    );
  });

  test("should simulate sign up mutation with mocked user", async () => {
    // Mocking User creation during signUp
    const mockUser = {
      id: "1",
      email: "test@example.com",
    };

    mockingoose(User).toReturn(mockUser, "save");

    const query = `
      mutation {
        signUp(email: "test@example.com", password: "password123") {
          id
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body.data.signUp.id).toBe("1");
    expect(response.body.data.signUp.email).toBe("test@example.com");
  });

  test("should simulate hotel booking mutation", async () => {
    // Mock Hotel and Booking creation
    const mockHotel = {
      hotel_id: 1,
      hotel_name: "Test Hotel",
    };

    const mockBooking = {
      id: "1",
      hotel_id: 1,
      email: "test@example.com",
      booking_date: "19-01-25",
    };

    mockingoose(Hotel).toReturn(mockHotel, "findOne");
    mockingoose(Booking).toReturn(mockBooking, "save");

    const query = `
      mutation {
        bookHotel(hotel_id: 1, email: "test@example.com", booking_date: "2025-01-19") {
          id
          hotel_id
          booking_date
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body.data.bookHotel.id).toBe("1");
    expect(response.body.data.bookHotel.hotel_id).toBe(1);
    expect(response.body.data.bookHotel.booking_date).toBe("19-01-25");
  });

  test("should return error if hotel not found during booking", async () => {
    // Simulate that the hotel does not exist
    mockingoose(Hotel).toReturn(null, "findOne");

    const query = `
      mutation {
        bookHotel(hotel_id: 1, email: "test@example.com", booking_date: "2025-01-19") {
          id
          hotel_id
          booking_date
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe("Hotel not found");
  });
});
