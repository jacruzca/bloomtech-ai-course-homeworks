import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph } from "@langchain/langgraph";
import { MemorySaver, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { writeFileSync } from "fs";
dotenv.config();

const run = async () => {
  console.log("Hello LangGraph!");

  // Define the graph state
  // See here for more info: https://langchain-ai.github.io/langgraphjs/how-tos/define-state/
  const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
    }),
  });

  // Define the tools for the agent to use
  const weatherTool = tool(
    async ({ query }) => {
      // This is a placeholder for the actual implementation
      if (
        query.toLowerCase().includes("sf") ||
        query.toLowerCase().includes("san francisco")
      ) {
        return "It's 60 degrees and foggy.";
      }
      return "It's 90 degrees and sunny.";
    },
    {
      name: "weather",
      description: "Call to get the current weather for a location.",
      schema: z.object({
        query: z.string().describe("The query to use in your search."),
      }),
    }
  );

  const tools = [weatherTool];
  const toolNode = new ToolNode(tools);

  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  }).bindTools(tools);

  // Define the function that determines whether to continue or not
  // We can extract the state typing via `StateAnnotation.State`
  function shouldContinue(state: typeof StateAnnotation.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.tool_calls?.length) {
      return "tools";
    }
    // Otherwise, we stop (reply to the user)
    return "__end__";
  }

  // Define the function that calls the model
  async function callModel(state: typeof StateAnnotation.State) {
    const messages = state.messages;
    const response = await model.invoke(messages);

    // We return a list, because this will get added to the existing list
    return { messages: [response] };
  }

  // Define a new graph
  const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  // Initialize memory to persist state between graph runs
  const checkpointer = new MemorySaver();

  // Finally, we compile it!
  // This compiles it into a LangChain Runnable.
  // Note that we're (optionally) passing the memory when compiling the graph
  const app = workflow.compile({ checkpointer });

  // Use the Runnable
  const finalState = await app.invoke(
    { messages: [new HumanMessage("what is the weather in sf")] },
    { configurable: { thread_id: "42" } }
  );

  console.log(finalState.messages[finalState.messages.length - 1].content);

  const nextState = await app.invoke(
    { messages: [new HumanMessage("what about ny")] },
    { configurable: { thread_id: "42" } }
  );
  console.log(nextState.messages[nextState.messages.length - 1].content);

  const graph = app.getGraph();
  const image = await graph.drawMermaidPng();
  const arrayBuffer = await image.arrayBuffer();
  writeFileSync("langgraph/graph.png", Buffer.from(arrayBuffer));
};

run();
