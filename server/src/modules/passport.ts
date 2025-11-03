import { Strategy as LocalStrategy } from "passport-local";
import FastifyPassport from "@fastify/passport";
import { User } from "../schemas/User.js";
import bcrypt from "bcrypt";


const identityStrategy = new LocalStrategy({ usernameField: "identity" }, async (identity, password, done) => {
  try {

    let email: string | null = null;
    let username: string | null = null;

    if (identity.includes("@")) email = identity;
    else {
      username = identity;
    }

    const user = identity.includes("@")
    ? await User.findOne({ email: email })
    : await User.findOne({ username: username });

    if (!user || !user.password) return done(new Error("User not found"), false);
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(new Error("Invalid Password"), false);

    return done(null, user);
  } catch (err) {
    return done(err);
  }
})

FastifyPassport.registerUserSerializer(async (user: any) => {
  return user._id.toString();
});

FastifyPassport.registerUserDeserializer(async (id: string) => {
  try {
    const user = await User.findById(id);
    return user;
  } catch (err) {
    console.error("Error deserializing user:", err);
    return null;
  }
});

export {identityStrategy};
