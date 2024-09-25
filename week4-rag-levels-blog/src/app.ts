import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { getLevelsBlogRetriever } from "../../util/retrievers";

// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
dotenv.config();

const run = async () => {
  // Initialize the ChatOpenAI model
  const model = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });

  // Create a retriever using getLevelsBlogRetriever
  const retriever = getLevelsBlogRetriever();

  // Create a formatting function for documents
  const formatDocs = (docs: any[]) => {
    return docs.map((doc) => doc.pageContent).join("\n\n");
  };

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromTemplate(`
    Answer the question based only on the following context:
    {context}

    Question: {question}

    Answer:
  `);

  // Create the RAG chain
  const ragChain = RunnableSequence.from([
    {
      context: async (input: { question: string }) => {
        const relevantDocs = await retriever.invoke(input.question);
        return formatDocs(relevantDocs);
      },
      question: (input: { question: string }) => input.question,
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  // Function to run the conversation
  const runConversation = async (userInput: string) => {
    const result = await ragChain.invoke({ question: userInput });
    return result;
  };

  // Example conversation
  const conversations = [
    "Tell me about the Levels blog.",
    "What are some popular topics discussed in the blog?",
    "Can you provide more details about metabolic health?",
  ];

  for (const userInput of conversations) {
    console.log(`Human: ${userInput}`);
    const response = await runConversation(userInput);
    console.log(`AI: ${response}\n`);
  }
};

run();
