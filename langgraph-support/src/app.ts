import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { writeFileSync } from "fs";

// Load environment variables (populate process.env from .env file)
import {
  Annotation,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { StateAnnotation } from "./stateAnnotation";
import { initialSupport } from "./initialSupport";
import { billingSupport } from "./billingSupport";
import { technicalSupport } from "./technicalSupport";
import { handleRefund } from "./handleRefund";

import * as dotenv from "dotenv";
dotenv.config();

/**
 * See: https://langchain-ai.github.io/langgraphjs/tutorials/chatbots/customer_support_small_model/#laying-out-the-graph
 */
const run = async () => {
  console.log("Starting...");
  let builder = new StateGraph(StateAnnotation)
    .addNode("initial_support", initialSupport)
    .addNode("billing_support", billingSupport)
    .addNode("technical_support", technicalSupport)
    .addNode("handle_refund", handleRefund)
    .addEdge("__start__", "initial_support");

  // Note: We do not use tool calling here for formatting the next step from
  // the history because our model does not support it, but you can apply it here if your model does.
  builder = builder.addConditionalEdges(
    "initial_support",
    async (state: typeof StateAnnotation.State) => {
      if (state.nextRepresentative.includes("BILLING")) {
        return "billing";
      } else if (state.nextRepresentative.includes("TECHNICAL")) {
        return "technical";
      } else {
        return "conversational";
      }
    },
    {
      billing: "billing_support",
      technical: "technical_support",
      conversational: "__end__",
    }
  );

  builder = builder
    .addEdge("technical_support", "__end__")
    .addConditionalEdges(
      "billing_support",
      async (state) => {
        if (state.nextRepresentative.includes("REFUND")) {
          return "refund";
        } else {
          return "__end__";
        }
      },
      {
        refund: "handle_refund",
        __end__: "__end__",
      }
    )
    .addEdge("handle_refund", "__end__");

  console.log("Added edges!");

  const checkpointer = new MemorySaver();

  const graph = builder.compile({
    checkpointer,
  });

  const representation = graph.getGraph();
  const image = await representation.drawMermaidPng();
  const arrayBuffer = await image.arrayBuffer();
  writeFileSync("langgraph-support/graph.png", Buffer.from(arrayBuffer));

  const stream = await graph.stream(
    {
      messages: [
        {
          role: "user",
          content:
            "I've changed my mind and I want a refund for order #182818!",
        },
      ],
    },
    {
      configurable: {
        thread_id: "refund_testing_id",
      },
    }
  );

  for await (const value of stream) {
    console.log("---STEP---");
    console.log(value);
    console.log("---END STEP---");
  }

  // execution goes to billing_support, but then hits our dynamic interrupt
  // because refundAuthorized is not set in the graph state. We can see this
  // by inspecting the current state of the graph and noting that there is
  // an interrupt when running handle_refund:
  const currentState = await graph.getState({
    configurable: { thread_id: "refund_testing_id" },
  });

  console.log("CURRENT TASKS", JSON.stringify(currentState.tasks, null, 2));

  // But this will again hit the interrupt becuase refundAuthorized is not set.
  // If we update the state to set refundAuthorized to true, then resume the graph by
  // running it with the same thread_id and passing null as the input, execution will
  // continue and the refund will process:
  await graph.updateState(
    { configurable: { thread_id: "refund_testing_id" } },
    {
      refundAuthorized: true,
    }
  );

  const resumedStream = await graph.stream(null, {
    configurable: { thread_id: "refund_testing_id" },
  });

  for await (const value of resumedStream) {
    console.log(value);
  }

  // Now, let's try a technical question:
  const technicalStream = await graph.stream(
    {
      messages: [
        {
          role: "user",
          content:
            "My LangCorp computer isn't turning on because I dropped it in water.",
        },
      ],
    },
    {
      configurable: {
        thread_id: "technical_testing_id",
      },
    }
  );

  // We can see the query gets correctly routed to the technical support node!
  for await (const value of technicalStream) {
    console.log(value);
  }

  // Finally, let's try a simple conversational response:
  const conversationalStream = await graph.stream(
    {
      messages: [
        {
          role: "user",
          content: "How are you? I'm Cobb.",
        },
      ],
    },
    {
      configurable: {
        thread_id: "conversational_testing_id",
      },
    }
  );

  for await (const value of conversationalStream) {
    console.log(value);
  }
};

run();
