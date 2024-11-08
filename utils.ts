import { Collection } from "mongodb";
import { Car, CarModel, User, UserModel } from "./types.ts";

export const fromModelToUser = async (
    model: UserModel,
    carsCollection: Collection<CarModel>,
): Promise<User> => {
    const cars = await carsCollection.find({
        _id: { $in: model.cars },
    }).toArray();

    return {
        id: model._id!.toString(),
        name: model.name,
        age: model.age,
        email: model.email,
        cars: cars.map((c) => fromModelToCar(c)),
    };
};

export const fromModelToCar = (model: CarModel): Car => ({
    id: model._id!.toString(),
    brand: model.brand,
    carriage: model.carriage,
});
