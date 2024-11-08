import { MongoClient, ObjectId } from "mongodb";
import { CarModel, UserModel } from "./types.ts";
import { fromModelToCar, fromModelToUser } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.error("Need a MONGO_URL");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("SimulacroParcialCars");
const usersCollection = db.collection<UserModel>("users");
const carsCollection = db.collection<CarModel>("cars");

const handler = async (req: Request): Promise<Response> => {
  const method = await req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET") {
    if (path === "/users") {
      const name = url.searchParams.get("name");
      if (name) {
        const usersDB = await usersCollection.find({ name }).toArray();
        const users = await Promise.all(
          usersDB.map((u) => fromModelToUser(u, carsCollection)),
        );
        return new Response(JSON.stringify(users));
      } else {
        const usersDB = await usersCollection.find().toArray();
        const users = await Promise.all(
          usersDB.map((u) => fromModelToUser(u, carsCollection)),
        );
        return new Response(JSON.stringify(users));
      }
    } else if (path === "/user") {
      const email = url.searchParams.get("email");
      if (!email) return new Response("Bad request", { status: 400 });
      const userDB = await usersCollection.findOne({ email });
      if (!userDB) return new Response("User not found", { status: 404 });
      const user = await fromModelToUser(userDB, carsCollection);
      return new Response(JSON.stringify(user));
    } else if (path === "/cars") {
      const carsDB = await carsCollection.find().toArray();
      const cars = await carsDB.map((c) => fromModelToCar(c));
      return new Response(JSON.stringify(cars));
    } else if (path === "/car") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Bad request", { status: 400 });
      const carDB = await carsCollection.findOne(
        { _id: new ObjectId(id) },
      );
      if (!carDB) return new Response("Car not found", { status: 404 });
      const car = fromModelToCar(carDB);
      return new Response(JSON.stringify(car));
    }
  } else if (method === "POST") {
    if (path === "/user") {
      const user = await req.json();
      if (!user.name || !user.age || !user.email) {
        return new Response("Bad request", { status: 404 });
      }
      //Check if user exists by email
      const userDB = await usersCollection.findOne({ email: user.email });
      if (userDB) return new Response("User already exist", { status: 409 });

      const { insertedId } = await usersCollection.insertOne({
        name: user.name,
        age: user.age,
        email: user.email,
        cars: [],
      });

      return new Response(
        JSON.stringify({
          name: user.name,
          age: user.age,
          email: user.email,
          cars: [],
          id: insertedId,
        }),
        { status: 201 },
      );
    } else if (path === "/car") {
      const car = await req.json();
      if (!car.brand || !car.carriage) {
        return new Response("Bad request", { status: 404 });
      }

      const { insertedId } = await carsCollection.insertOne({
        brand: car.brand,
        carriage: car.carriage,
      });

      return new Response(
        JSON.stringify({
          brand: car.brand,
          carriage: car.carriage,
          id: insertedId,
        }),
        { status: 201 },
      );
    }
  } else if (method === "PUT") {
    if (path === "/user") {
      const user = await req.json();
      if (!user.name || !user.age || !user.email) {
        return new Response("Bad request", { status: 404 });
      }

      const { modifiedCount } = await usersCollection.updateOne(
        { email: user.email },
        { $set: { name: user.name, age: user.age, cars: user.cars } },
      );

      if (modifiedCount === 0) {
        return new Response("User not found", { status: 404 });
      }

      return new Response("OK", { status: 200 });
    } else if (path === "/car") {
      const car = await req.json();
      if (!car.brand || !car.carriage) {
        return new Response("Bad request", { status: 404 });
      }

      const { modifiedCount } = await carsCollection.updateOne(
        { _id: new ObjectId(car.id as string) },
        { $set: { brand: car.brand, carriage: car.carriage } },
      );
      if (modifiedCount === 0) {
        return new Response("Car not found", { status: 404 });
      }

      return new Response("OK", { status: 200 });
    }
  } else if (method === "DELETE") {
    if (path === "/user") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Bad request", { status: 400 });

      const { deletedCount } = await usersCollection.deleteOne(
        { _id: new ObjectId(id) },
      );

      if (deletedCount === 0) {
        return new Response("Usser not found", { status: 404 });
      }

      return new Response("OK", { status: 200 });
    } else if (path === "/car") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Bad request", { status: 400 });

      const { deletedCount } = await usersCollection.deleteOne(
        { _id: new ObjectId(id) },
      );

      if (deletedCount === 0) {
        return new Response("Usser not found", { status: 404 });
      }

      await usersCollection.updateMany(
        { cars: new ObjectId(id) },
        { $pull: { cars: new ObjectId(id) } },
      );
      return new Response("OK", { status: 200 });
    }
  }
  return new Response("Endpoint not found", { status: 404 });
};

Deno.serve({ port: 3000 }, handler);
