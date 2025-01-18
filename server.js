const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const schema = require("./schema/schema");
const cors = require("cors");
const { ApolloServer, gql } = require("apollo-server");
const Hotel = require("./models/Hotel");

dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for cross-origin requests

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// GraphQL Middleware
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

const typeDefs = gql`
  type Hotel {
    hotel_id: Int
    chain_name: String
    hotel_name: String
    city: String
    country: String
    star_rating: Float
    latitude: Float
    longitude: Float
    photo1: String
    overview: String
    rates_from: Float
    rates_currency: String
  }

  type Query {
    hotels: [Hotel]
    hotel(hotel_id: Int!): Hotel
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    hotels: async () => {
      return await Hotel.find();
    },
    hotel: async (_, { hotel_id }) => {
      return await Hotel.findOne({ hotel_id });
    },
  },
};

// Start Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 5001 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/graphql`);
});
