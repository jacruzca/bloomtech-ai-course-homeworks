import { writeFileSync } from "fs";

import * as dotenv from "dotenv";
import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./graphState";
import { toolNode } from "./tools";
import {
  agent,
  checkRelevance,
  generate,
  gradeDocuments,
  rewrite,
  shouldRetrieve,
} from "./edges";
import { HumanMessage } from "@langchain/core/messages";
dotenv.config();

/**
 * See: https://langchain-ai.github.io/langgraphjs/tutorials/chatbots/customer_support_small_model/#laying-out-the-graph
 */
const run = async () => {
  console.log("Starting...");

  // Define the graph
  const workflow = new StateGraph(GraphState)
    // Define the nodes which we'll cycle between.
    .addNode("agent", agent)
    .addNode("retrieve", toolNode)
    .addNode("gradeDocuments", gradeDocuments)
    .addNode("rewrite", rewrite)
    .addNode("generate", generate);

  // Call agent node to decide to retrieve or not
  workflow.addEdge(START, "agent");

  // Decide whether to retrieve
  workflow.addConditionalEdges(
    "agent",
    // Assess agent decision
    shouldRetrieve
  );

  workflow.addEdge("retrieve", "gradeDocuments");

  // Edges taken after the `action` node is called.
  workflow.addConditionalEdges(
    "gradeDocuments",
    // Assess agent decision
    checkRelevance,
    {
      // Call tool node
      yes: "generate",
      no: "rewrite", // placeholder
    }
  );

  workflow.addEdge("generate", END);
  workflow.addEdge("rewrite", "agent");

  // Compile
  const graph = workflow.compile();

  const representation = graph.getGraph();
  const image = await representation.drawMermaidPng();
  const arrayBuffer = await image.arrayBuffer();
  writeFileSync("langgraph-agentic-rag/graph.png", Buffer.from(arrayBuffer));

  const inputs = {
    messages: [
      new HumanMessage(
        "What are the types of agent memory based on Lilian Weng's blog post?"
      ),
    ],
  };
  let finalState;
  for await (const output of await graph.stream(inputs)) {
    for (const [key, value] of Object.entries(output)) {
      const lastMsg = output[key].messages[output[key].messages.length - 1];
      console.log(`Output from node: '${key}'`);
      console.dir(
        {
          type: lastMsg._getType(),
          content: lastMsg.content,
          tool_calls: lastMsg.tool_calls,
        },
        { depth: null }
      );
      console.log("---\n");
      finalState = value;
    }
  }

  console.log(JSON.stringify(finalState, null, 2));
};

run();
