"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { Post } from "../types/post";

async function fetchPosts(): Promise<Post[]> {
  const { data } = await api.get("/posts");
  return data;
}

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
}
