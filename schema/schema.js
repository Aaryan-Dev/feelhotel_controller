const { GraphQLObjectType, GraphQLSchema, GraphQLString } = require("graphql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// User Type
const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    email: { type: GraphQLString },
    token: { type: GraphQLString },
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
          console.log('existingUser', existingUser)
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
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
