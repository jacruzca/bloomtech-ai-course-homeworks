// Import the OpenAPI Large Language Model (you can import other models here eg. Cohere)
import { OpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

// Import the PromptTemplate module
import { PromptTemplate } from "@langchain/core/prompts";

// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
dotenv.config();

export const run = async () => {
  // TODO implement homework here
};

// Call the run function with the desired number of conversation turns
run(); // Replace 5 with the desired number of turns
