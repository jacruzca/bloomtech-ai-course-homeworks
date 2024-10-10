import { StateAnnotation } from "./stateAnnotation";
import { model } from "./model";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { isAIMessage } from "@langchain/core/messages";

import * as dotenv from "dotenv";
dotenv.config();

export const billingSupport = async (state: typeof StateAnnotation.State) => {
  const SYSTEM_TEMPLATE = `You are an expert billing support specialist for LangCorp, a company that sells computers.
  Help the user to the best of your ability, but be concise in your responses.
  You have the ability to authorize refunds, which you can do by transferring the user to another agent who will collect the required information.
  If you do, assume the other agent has all necessary information about the customer and their order.
  You do not need to ask the user for more information.
  
  Help the user to the best of your ability, but be concise in your responses.`;

  let trimmedHistory = state.messages;
  // Make the user's question the most recent message in the history.
  // This helps small models stay focused.
  const lastMessage = trimmedHistory.at(-1);
  if (lastMessage && isAIMessage(lastMessage)) {
    trimmedHistory = trimmedHistory.slice(0, -1);
  }

  const billingRepResponse = await model.invoke([
    {
      role: "system",
      content: SYSTEM_TEMPLATE,
    },
    ...trimmedHistory,
  ]);
  const CATEGORIZATION_SYSTEM_TEMPLATE = `Your job is to detect whether a billing support representative wants to refund the user.`;
  const CATEGORIZATION_HUMAN_TEMPLATE = `The following text is a response from a customer support representative.
  Extract whether they want to refund the user or not.
  Respond with a JSON object containing a single key called "nextRepresentative" with one of the following values:
  
  If they want to refund the user, respond only with the word "REFUND".
  Otherwise, respond only with the word "RESPOND".
  
  Here is the text:
  
  
  ${billingRepResponse.content}
  .`;
  const categorizationResponse = await model.invoke(
    [
      {
        role: "system",
        content: CATEGORIZATION_SYSTEM_TEMPLATE,
      },
      {
        role: "user",
        content: CATEGORIZATION_HUMAN_TEMPLATE,
      },
    ],
    {
      response_format: {
        type: "json_object",
        schema: zodToJsonSchema(
          z.object({
            nextRepresentative: z.enum(["REFUND", "RESPOND"]),
          })
        ),
      },
    }
  );
  const categorizationOutput = JSON.parse(
    categorizationResponse.content as string
  );
  return {
    messages: billingRepResponse,
    nextRepresentative: categorizationOutput.nextRepresentative,
  };
};
