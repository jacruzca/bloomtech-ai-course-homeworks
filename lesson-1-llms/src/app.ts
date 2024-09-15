// Import the OpenAPI Large Language Model (you can import other models here eg. Cohere)
import { OpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

// Import the PromptTemplate module
import { PromptTemplate } from "@langchain/core/prompts";

// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
dotenv.config();

/**
 * This function runs a conversation between two AI models discussing the process of building a CRUD app.
 * @param n the number of conversation turns
 */
export const run = async (n: number) => {
  // Instantiate BufferMemory for each AI to maintain separate chat histories
  const memoryAI1 = new BufferMemory({ memoryKey: "chat_history" });
  const memoryAI2 = new BufferMemory({ memoryKey: "chat_history" });

  // Instantiate the OpenAI model for each AI
  const modelAI1 = new OpenAI({ temperature: 0.7 });
  const modelAI2 = new OpenAI({ temperature: 0.7 });

  // Create the template for the conversation
  const templateAI1 = `
    AI1 is a senior software engineer discussing the process of building a CRUD app, focusing on backend architecture. Keep the conversation concise and focus on key points.
      Current conversation:
      {chat_history}
      AI2: {input}
      AI1:`;

  const templateAI2 = `
  AI2 is a front-end developer discussing the process of building a CRUD app, focusing on user interface and experience. Keep the conversation concise and focus on key points.
      Current conversation:
      {chat_history}
      AI1: {input}
      AI2:`;

  // Instantiate PromptTemplate for each AI
  const promptAI1 = PromptTemplate.fromTemplate(templateAI1);
  const promptAI2 = PromptTemplate.fromTemplate(templateAI2);

  // Create conversation chains for each AI
  const chainAI1 = new ConversationChain({
    memory: memoryAI1,
    prompt: promptAI1,
    llm: modelAI1,
  });

  const chainAI2 = new ConversationChain({
    memory: memoryAI2,
    prompt: promptAI2,
    llm: modelAI2,
  });

  const starter = "Hi, I'm AI1. Let's discuss building a CRUD app.";

  // Start the conversation with AI1
  let responseAI1 = await chainAI1.call({
    input: starter,
  });

  console.log("starter", starter);

  let responseAI2;
  for (let i = 0; i < n; i++) {
    console.log("\ni --------------------:", i);
    // Alternate between AI1 and AI2
    responseAI2 = await chainAI2.call({
      input: responseAI1.response, // Pass AI1's response as input to AI2
    });
    console.log("\nAI2::::::", responseAI2.response);

    responseAI1 = await chainAI1.call({
      input: responseAI2.response, // Pass AI2's response back to AI1
    });
    console.log("\nAI1::::::", responseAI1.response);
  }
};

// Call the run function with the desired number of conversation turns
run(15); // Replace 5 with the desired number of turns
