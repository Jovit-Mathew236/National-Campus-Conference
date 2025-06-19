import { Client, Account, Teams } from "node-appwrite";

if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  throw new Error("APPWRITE_ENDPOINT is not set");
if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  throw new Error("APPWRITE_PROJECT_ID is not set");
if (!process.env.NEXT_PUBLIC_APPWRITE_API_KEY)
  throw new Error("APPWRITE_API_KEY is not set");

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY);

export const account = new Account(client);
export const teams = new Teams(client);
