import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatPromptTemplate } from "@langchain/core/prompts";

// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
import { DynamicStructuredTool, DynamicTool } from "langchain/tools";
import { z } from "zod";
dotenv.config();

const EXCHANGE_RATES_KEY = process.env.EXCHANGE_RATES_KEY;

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
    // a function to generate the Fibonacci sequence up to a given number n using either iterative or recursive methods. Optimize for large values of n.
    new DynamicStructuredTool({
      name: "fibonacci-sequence-generator",
      description:
        "generates the Fibonacci sequence up to a given number n using either iterative or recursive methods",
      schema: z.object({
        n: z
          .number()
          .describe(
            "The number up to which the Fibonacci sequence should be generated"
          ),
        method: z
          .enum(["iterative", "recursive"])
          .describe("The method to use for generating the sequence"),
      }),
      func: async ({ n, method }) => {
        const fibonacciIterative = (n) => {
          const sequence = [0, 1];
          for (let i = 2; i <= n; i++) {
            sequence.push(sequence[i - 1] + sequence[i - 2]);
          }
          return sequence;
        };

        const fibonacciRecursive = (n) => {
          if (n <= 1) {
            return [0, 1];
          } else {
            const sequence = fibonacciRecursive(n - 1);
            sequence.push(
              sequence[sequence.length - 1] + sequence[sequence.length - 2]
            );
            return sequence;
          }
        };

        const sequence =
          method === "iterative"
            ? fibonacciIterative(n)
            : fibonacciRecursive(n);
        return `The Fibonacci sequence up to ${n} is ${sequence.join(", ")}`;
      },
    }),
    // tool that uses https://exchangeratesapi.io/ to convert an amount from one currency to another. Use the EXCHANGE_RATES_KEY environment variable to authenticate.
    // this tool has a rest api with base url https://api.exchangeratesapi.io/v1/ and to get access use
    // https://api.exchangeratesapi.io/v1/convert?access_key=API_KEY&from=COP&to=USD&amount=25
    new DynamicStructuredTool({
      name: "currency-converter",
      description:
        "converts an amount from one currency to another using the exchange rates API",
      schema: z.object({
        amount: z.number().describe("The amount to convert"),
        from: z.string().describe("The currency to convert from"),
        to: z.string().describe("The currency to convert to"),
      }),
      func: async ({ amount, from, to }) => {
        // I couldn't get the API to work for free, so I'm just returning a placeholder value
        switch (from) {
          case "COP":
            return `${amount} COP is ${amount * 0.00026} USD`;
          case "USD":
            return `${amount} USD is ${amount * 4200} COP`;
          default:
            return `The currency ${from} is not supported`;
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
    verbose: false,
  });

  // const result = await agentExecutor.invoke({
  //   input: `What is the value of foo?`,
  // });

  // console.log(`Got output ${result.output}`);

  // const result2 = await agentExecutor.invoke({
  //   input: `Generate a random number between 1 and 10.`,
  // });

  // console.log(`Got output ${result2.output}`);

  // const result3 = await agentExecutor.invoke({
  //   input: `Solve a quadratic equation with coefficients a=1, b=2, and c=1.`,
  // });

  // console.log(`Got output ${result3.output}`);

  // const result4 = await agentExecutor.invoke({
  //   input: `generate the Fibonacci sequence up to 15`,
  // });

  // console.log(`Got output ${result4.output}`);

  const result5 = await agentExecutor.invoke({
    input: `How much is 5000 COP to USD?`,
  });

  console.log(`Got output ${result5.output}`);
};

run();
