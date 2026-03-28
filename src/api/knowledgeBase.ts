import api from "../lib/axios";
import routes from "../lib/routes";

interface KnowledgeBaseSearchRequest {
  query: string;
  query_properties?: string[];
  return_properties?: string[];
  limit?: number;
  high_similarity_threshold?: number;
  similar_threshold?: number;
  workspace_uuid?: string;
  collection_uuid?: string;
  user_uuid?: string;
}

interface KnowledgeBaseDocument {
  uuid: string;
  properties: {
    content?: string;
    uuid?: string;
    collection_uuid?: string;
    workspace_uuid?: string;
    author?: string;
    type?: string;
    access_level?: number;
    shared_with?: string[];
    created_at?: string;
  };
  relevance_score?: number;
}

interface KnowledgeBaseSearchResponse {
  results: KnowledgeBaseDocument[];
}

/**
 * Search the knowledge base for relevant documents
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 5,
  filters?: {
    workspace_uuid?: string;
    collection_uuid?: string;
    user_uuid?: string;
  },
): Promise<KnowledgeBaseSearchResponse> {
  const { data } = await api.post<{ data: KnowledgeBaseSearchResponse }>(
    routes.knowledgeBase.search,
    {
      query,
      query_properties: ["content"],
      return_properties: [
        "content",
        "uuid",
        "collection_uuid",
        "workspace_uuid",
        "author",
        "type",
      ],
      limit,
      workspace_uuid: filters?.workspace_uuid,
      collection_uuid: filters?.collection_uuid,
      user_uuid: filters?.user_uuid,
    },
  );
  return data.data;
}
