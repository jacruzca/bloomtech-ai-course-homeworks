import { OpenAI } from "@langchain/openai";
import { Diff } from "./github-util";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

export const buildPromptForASingleReadmeFile = async (
  diffFiles: Diff[],
  commitMessages: string[],
  adjacentFilesToReadme: string[],
  readmeContents: string
): Promise<BaseMessage[]> => {
  // Extract the files from diffFiles that are in adjacentFilesToReadme
  const relatedDiff = diffFiles.filter((diff) => {
    return adjacentFilesToReadme.includes(diff.filename);
  });

  // Combine the changes into a single string with clear delineation
  const changes =
    relatedDiff.length > 0
      ? relatedDiff
          .map((diff) => {
            return `\nChanges in ${diff.filename}:\n${diff.patch}`;
          })
          .join("\n")
      : "No relevant changes found.";

  // Combine all commit messages into a single string
  const combinedCommitMessages =
    commitMessages.length > 0
      ? commitMessages.join("\n") + "\n\n"
      : "No commit messages available.\n\n";

  // Construct the prompt string with clear instructions for the LLM
  const promptString = `
      Please review the following code changes and commit messages from a GitHub pull request:
  
      Code changes from Pull Request:
      {changes}
  
      Commit messages:
      {combinedCommitMessages}
  
      Here is the current README file content:
      {readmeContents}
  
      Consider the code changes from the Pull Request (including changes in docstrings and other metadata), and the commit messages. Determine if the README needs to be updated. If so, edit the README, ensuring to maintain its existing style and clarity.

      Do not include the code changes in the README file. Instead, focus on updating the README to reflect the changes made in the code.
  
      Updated README:
    `;

  const systemTemplate =
    "You are an AI trained to help with updating README files based on code changes.";

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["human", promptString],
  ]);

  const messages = await chatPrompt.formatMessages({
    changes,
    combinedCommitMessages,
    readmeContents,
  });

  return messages;
};

export const callOpenAI = async (messages: BaseMessage[]) => {
  const model = new OpenAI({ temperature: 0.7 });

  const response = await model.invoke(messages);

  return response;
};
