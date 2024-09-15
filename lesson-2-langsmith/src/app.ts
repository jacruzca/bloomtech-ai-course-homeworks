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

// An illustrative custom evaluator example
const notUnsure = async ({
  run,
  example,
  input,
  prediction,
  reference,
}: DynamicRunEvaluatorParams) => {
  if (typeof prediction?.output !== "string") {
    throw new Error(
      "Invalid prediction format for this evaluator. Please check your chain's outputs and try again."
    );
  }
  return {
    key: "not_unsure",
    score: !prediction.output.includes("not sure"),
  };
};

const evaluators: RunEvalType[] = [
  // LangChain's built-in evaluators
  LabeledCriteria("correctness"),

  // (Optional) Format the raw input and output from the chain and example correctly
  Criteria("conciseness", {
    formatEvaluatorInputs: (run) => ({
      input: run.rawInput.question,
      prediction: run.rawPrediction.output,
      reference: run.rawReferenceOutput.answer,
    }),
  }),

  // Custom evaluators can be user-defined RunEvaluator's
  // or a compatible function
  notUnsure,
];

const client = new Client();

// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Main function to run the OpenAI agent with the provided tools and prompt.
 * Fetches the prompt from the LangSmith hub, creates the agent, and executes it on a dataset.
 */
const run = async () => {
  const tools = [new TavilySearchResults()];

  // Get the prompt to use - you can modify this!
  // If you want to see the prompt in full, you can at:
  // https://smith.langchain.com/hub/hwchase17/openai-functions-agent
  const prompt = await pull<ChatPromptTemplate>(
    "hwchase17/openai-functions-agent"
  );

  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo-1106",
    temperature: 0,
  });

  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  // Same input structure that our declared `agentExecutor` takes
  const inputs = [
    { input: "What is LangChain?" },
    { input: "What's LangSmith?" },
    { input: "When was Llama-v2 released?" },
    { input: "What is the langsmith cookbook?" },
    { input: "When did langchain first announce the hub?" },
  ];

  const results = await agentExecutor.batch(inputs);
  console.log(results.slice(0, 2));

  // Same structure as our `agentExecutor` output
  const referenceOutputs = [
    {
      output:
        "LangChain is an open-source framework for building applications using large language models. It is also the name of the company building LangSmith.",
    },
    {
      output:
        "LangSmith is a unified platform for debugging, testing, and monitoring language model applications and agents powered by LangChain",
    },
    { output: "July 18, 2023" },
    {
      output:
        "The langsmith cookbook is a github repository containing detailed examples of how to use LangSmith to debug, evaluate, and monitor large language model-powered applications.",
    },
    { output: "September 5, 2023" },
  ];

  const datasetName = `lcjs-qa-default`;
  const dataset = await client.createDataset(datasetName);

  await Promise.all(
    inputs.map(async (input, i) => {
      await client.createExample(input, referenceOutputs[i], {
        datasetId: dataset.id,
      });
    })
  );

  await runOnDataset(agentExecutor, datasetName, {
    evaluators,
  });
};

// Call the run function with the desired number of conversation turns
run(); // Replace 5 with the desired number of turns
