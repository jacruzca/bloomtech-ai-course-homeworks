import { ChatOpenAI, OpenAI } from "@langchain/openai";
import { Diff } from "./github-util";
import { IssueConnection } from "@linear/sdk";
import { Document } from "langchain/document";

import { RunnableSequence } from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export const buildDocumentsForVectorStore = (allIssues: IssueConnection) => {
  const issues = allIssues.nodes.map((issue) => {
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
    };
  });

  const documents: Document[] = [];

  for (const issue of issues) {
    const document: Document = {
      pageContent: issue.title + " " + issue.description,
      metadata: { source: `https://linear.app/jhon-cruz/issue/${issue.id}` },
    };
    documents.push(document);
  }

  return documents;
};

type PromptContext = {
  diffFiles: Diff[];
  commitMessages: string[];
  adjacentFilesToReadme: string[];
  readmeContents: string;
  vectorStoreInput: string;
  vectorStore: MemoryVectorStore;
};

export const callOpenAI = async (context: PromptContext) => {
  const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.7 });
  const {
    diffFiles,
    commitMessages,
    adjacentFilesToReadme,
    readmeContents,
    vectorStoreInput,
    vectorStore,
  } = context;

  // Create a system & human prompt for the chat model
  const SYSTEM_TEMPLATE = `You are an AI trained to help with updating README files based on code changes.
  ----------------
  {context}`;

  // Construct the prompt string with clear instructions for the LLM
  const HUMAN_TEMPLATE = `
  Please review the following code changes and commit messages from a GitHub pull request.
  
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

  // Initialize a retriever wrapper around the vector store
  const vectorStoreRetriever = vectorStore.asRetriever({
    k: 2,
  });

  const result = await vectorStoreRetriever.invoke(vectorStoreInput);

  let vectorContext = "";

  for (const doc of result) {
    vectorContext += `* ${doc.pageContent} [${JSON.stringify(
      doc.metadata,
      null
    )}]`;
  }

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

  // Create the system and human message templates
  const systemMessage =
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE);
  const humanMessage = HumanMessagePromptTemplate.fromTemplate(HUMAN_TEMPLATE);

  // Create the prompt from messages and format the variables
  const prompt = await ChatPromptTemplate.fromMessages([
    systemMessage,
    humanMessage,
  ]);

  // Create the chain
  const chain = RunnableSequence.from([prompt, model]);

  const answer = await chain.invoke({
    context: vectorContext,
    changes,
    combinedCommitMessages,
    readmeContents,
  });

  return answer;
};
