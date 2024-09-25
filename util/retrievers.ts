import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

export const getLevelsBlogRetriever = () => {
  // Ensure these environment variables are set
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PRIVATE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-ada-002",
  });

  const client = createClient(supabaseUrl, supabaseKey);

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: client,
    tableName: "documents",
    queryName: "match_documents",
  });

  const retriever = vectorStore.asRetriever();

  return retriever;
};
