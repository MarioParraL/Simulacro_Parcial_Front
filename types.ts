import { ObjectId, OptionalId } from "mongodb";
export type UserModel = OptionalId<{
    name: string;
    age: number;
    email: string;
    cars: ObjectId[];
}>;

export type CarModel = OptionalId<{
    brand: string;
    carriage: number;
}>;

export type User = {
    id: string;
    name: string;
    age: number;
    email: string;
    cars: Car[];
};

export type Car = {
    id: string;
    brand: string;
    carriage: number;
};
