import { StateAnnotation } from "./stateAnnotation";
import { model } from "./model";
import { isAIMessage } from "@langchain/core/messages";

import * as dotenv from "dotenv";
dotenv.config();

export const technicalSupport = async (state: typeof StateAnnotation.State) => {
  const SYSTEM_TEMPLATE = `You are an expert at diagnosing technical computer issues. You work for a company called LangCorp that sells computers.
  Help the user to the best of your ability, but be concise in your responses.`;

  let trimmedHistory = state.messages;
  // Make the user's question the most recent message in the history.
  // This helps small models stay focused.
  const lastMessage = trimmedHistory.at(-1);
  if (lastMessage && isAIMessage(lastMessage)) {
    trimmedHistory = trimmedHistory.slice(0, -1);
  }

  const response = await model.invoke([
    {
      role: "system",
      content: SYSTEM_TEMPLATE,
    },
    ...trimmedHistory,
  ]);

  return {
    messages: response,
  };
};
