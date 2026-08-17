import knex from "knex";
import { Model } from "objection";
import config from "./knexfile";

export const db = knex(config);

Model.knex(db);