import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { Client } from "langsmith";
import {
  type RunEvalType,
  type DynamicRunEvaluatorParams,
  LabeledCriteria,
  Criteria,
} from "langchain/smith";
import { runOnDataset } from "langchain/smith";

// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
import { DynamicStructuredTool, DynamicTool } from "langchain/tools";
import { z } from "zod";
dotenv.config();

const run = async () => {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  const tools = [
    new DynamicTool({
      name: "FOO",
      description:
        "call this to get the value of foo. input should be an empty string.",
      func: async () => "baz",
    }),
    new DynamicStructuredTool({
      name: "random-number-generator",
      description: "generates a random number between two input numbers",
      schema: z.object({
        low: z.number().describe("The lower bound of the generated number"),
        high: z.number().describe("The upper bound of the generated number"),
      }),
      func: async ({ low, high }) =>
        (Math.random() * (high - low) + low).toString(), // Outputs still must be strings
    }),
    // a function to solve quadratic equations given coefficients a, b, and c. The function should handle real and complex roots and return them in a user-friendly format
    new DynamicStructuredTool({
      name: "quadratic-equation-solver",
      description: "solves a quadratic equation given coefficients a, b, and c",
      schema: z.object({
        a: z.number().describe("The coefficient of x^2"),
        b: z.number().describe("The coefficient of x"),
        c: z.number().describe("The constant term"),
      }),
      func: async ({ a, b, c }) => {
        const discriminant = b * b - 4 * a * c;
        if (discriminant > 0) {
          const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
          return `The roots are ${x1} and ${x2}`;
        } else if (discriminant === 0) {
          const x = -b / (2 * a);
          return `The root is ${x}`;
        } else {
          const realPart = -b / (2 * a);
          const imaginaryPart = Math.sqrt(-discriminant) / (2 * a);
          return `The roots are ${realPart} + ${imaginaryPart}i and ${realPart} - ${imaginaryPart}i`;
        }
      },
    }),
  ];

  // Get the prompt to use - you can modify this!\
  // If you want to see the prompt in full, you can at:
  // https://smith.langchain.com/hub/hwchase17/openai-functions-agent
  const prompt = await pull<ChatPromptTemplate>(
    "hwchase17/openai-functions-agent"
  );

  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  const result = await agentExecutor.invoke({
    input: `What is the value of foo?`,
  });

  console.log(`Got output ${result.output}`);

  const result2 = await agentExecutor.invoke({
    input: `Generate a random number between 1 and 10.`,
  });

  console.log(`Got output ${result2.output}`);

  const result3 = await agentExecutor.invoke({
    input: `Solve a quadratic equation with coefficients a=1, b=2, and c=1.`,
  });

  console.log(`Got output ${result3.output}`);
};

run();
