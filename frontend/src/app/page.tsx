'use client'
import React, { useState, useEffect,useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Comment } from '../components/Comment';
import { CommentInput } from '../components/CommentInput';
import type { Comment as CommentType } from '../types';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { ChevronDown,ChevronUp } from "lucide-react";
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function handleCheckAuth(router: any): Promise<{ isAuthenticated: boolean; username: string | null }> {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-auth`, { withCredentials: true });
    return { isAuthenticated: true, username: response.data.username };
  } catch (error) {
    router.push('/login'); // Redirect if not authenticated
    return { isAuthenticated: false, username: null };
  }
}


async function handleCheckUsername(router: any): Promise<{ isAuthenticated: boolean; username: string | null }> {
  try {
    // Check if the user is authenticated by checking their session or JWT token
    const response = await axios.get(`${API_BASE_URL}/check-auth`, { withCredentials: true });
    return { isAuthenticated: true, username: response.data.username }; // Return the username
  } catch (error) {
    return { isAuthenticated: false, username: null }; // Don't redirect, just return the state
  }
}


export const commentService = {
  async createComment(
    comment_text: string, 
    post_id: string, 
    parent_comment_id?: string | null, 
    isSpoiler: boolean = false
  ): Promise<CommentType> {
    try {
      const response = await axios.post(`${API_BASE_URL}/comments`, {
        comment_text,
        post_id,
        parent_comment_id,
        isSpoiler
      },{ withCredentials: true });
      
      
      return response.data.comment;
    } catch (error) {
      console.error('Failed to create comment', error);
      throw error;
    }
  },

  async getComments(post_id: string): Promise<CommentType[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/comments/${post_id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch comments', error);
      throw error;
    }
  },

  async likeComment(comment_id: string): Promise<{ likes: number, dislikes: number, userInteraction: 'like' | 'none' }> {
   
    try {
      const response = await axios.post(
        `${API_BASE_URL}/comments/${comment_id}/like`,
        {},
        { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Failed to like comment', error);
      throw error;
    }
  },

  async dislikeComment(comment_id: string): Promise<{ likes: number, dislikes: number, userInteraction: 'dislike' | 'none' }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/comments/${comment_id}/dislike`,
        {}, // Empty body
        { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Failed to dislike comment', error);
      throw error;
    }
  },


 

};

export default function Home() {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  

  // Helper function to build a tree
  
  useEffect(() => {
    const fetchAuthStatus = async () => {
      const { isAuthenticated, username } = await handleCheckUsername(router);
      setAuthenticated(isAuthenticated); // Update authenticated state
      setUserName(username); // Set username if authenticated
 
      
    };

    fetchAuthStatus();
  }, [router]);
  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments = await commentService.getComments('post1');
        setComments(fetchedComments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
    
    
    

  }, []);

  
  const handleLike = async (id: string) => {
    const { isAuthenticated } = await handleCheckAuth(router); // Pass router here
    if (!isAuthenticated) return;
    
    try {
      const response = await commentService.likeComment(id);
      
      const updateComments = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.comment_id === id) {
            return {
              ...comment,
              likes: response.likes,
              dislikes: response.dislikes,
              userInteraction: response.userInteraction
            };
          }
          if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComments(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(updateComments(comments));
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDislike = async (id: string) => {
    const { isAuthenticated } = await handleCheckAuth(router); // Pass router here
    if (!isAuthenticated) return;
    try {
      const response = await commentService.dislikeComment(id);
      
      const updateComments = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.comment_id === id) {
            return {
              ...comment,
              likes: response.likes,
              dislikes: response.dislikes,
              userInteraction: response.userInteraction
            };
          }
          if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComments(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(updateComments(comments));
    } catch (error) {
      console.error('Failed to dislike comment:', error);
    }
  };

  const handleNewComment = async (content: string, isSpoiler: boolean) => {
    const { isAuthenticated } = await handleCheckAuth(router); // Pass router here
    if (!isAuthenticated) return;
    try {
      const newComment = await commentService.createComment(content, 'post1', null, isSpoiler);
      setComments([newComment, ...comments]);
    } catch (error) {
      console.error('Failed to create comment:', error);
      // Optionally add error handling UI feedback here
    }
  };

  const handleReply = async (parentId: string, content: string, isSpoiler: boolean) => {
    const { isAuthenticated } = await handleCheckAuth(router); // Pass router here
    if (!isAuthenticated) return;
    try {
      const newReply = await commentService.createComment(content, 'post1', parentId, isSpoiler);
      
      const addReply = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.comment_id === parentId) {
            return {
              ...comment,
              replies: [...comment.replies, newReply]
            };
          }
          return {
            ...comment,
            replies: addReply(comment.replies)
          };
        });
      };

      setComments(addReply(comments));
    } catch (error) {
      console.error('Failed to create reply:', error);
      // Optionally add error handling UI feedback here
    }
  };

  const handleToggleCollapse = (id: string) => {
    console.log('Toggle collapse for comment:', id);
  };
  const [sortType, setSortType] = useState<string>('default');
  const sortedCommentsRef = useRef<CommentType[] | null>(null);
  const handleSortChange = (newSortType: string) => {
    if (comments) {
      const sortedComments = [...comments];
      
      switch (newSortType) {
        case 'newest':
          sortedComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          break;
        case 'oldest':
          sortedComments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          break;
        case 'mostLiked':
          sortedComments.sort((a, b) => b.likes - a.likes);
          break;
        default:
          break;
      }
    
     
      setSortType(newSortType);
      setComments(sortedComments);
    }
  };
  
  const handelLogout = async ()=>{
    try {
      const response = await axios.get(`${API_BASE_URL}/logout`, { withCredentials: true });
      if (response.data) {
        
        setAuthenticated(false);
        localStorage.removeItem('userId');
        location.reload();

        
      }
    } catch (error:any) {
     console.log(error);
     
    }

  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
      Loading comments...
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Episode 1</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="sr-only">Comments:</span>
              <span>{comments?.length} Comments</span>
            </div>
          </div>
          <DropdownMenu >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-slate-400">
                Sort by
                <div className=' flex flex-col'>
                <ChevronUp className="ml-2 h-4 w-4" />
                <ChevronDown className="ml-2 h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='bg-white rounded-xl p-0 w-[140px] flex flex-col justify-center' align="end">
              <DropdownMenuItem className=' cursor-pointer hover:bg-slate-200 pt-2' onClick={() => handleSortChange('newest')}>Newest</DropdownMenuItem>
              <DropdownMenuItem className=' cursor-pointer hover:bg-slate-200' onClick={() => handleSortChange('oldest')}>Oldest</DropdownMenuItem>
              <DropdownMenuItem className=' cursor-pointer hover:bg-slate-200 pb-2' onClick={() => handleSortChange('mostLiked')}>Most Liked</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className=' my-4 p-3'>
        {!authenticated ?
              <p className="text-sm text-slate-400">
                You must be{" "}
                  <Link href="/login" className="text-[#f0b0d2] hover:underline">login </Link> 
                to post a comment
              </p>
              : <div className=" flex flex-row w-full justify-between">
                {userName != null ? 
                <span className="text-sm text-slate-400 flex flex-row gap-3">
                  Comment as
                  <h1  className="text-[#f0b0d2] hover:underline bg-none">  { userName} </h1>
                  </span>:""}
                <p onClick={handelLogout} className="text-[#f0b0d2] hover:underline bg-none cursor-pointer">Logout </p>
                 </div> 
              }
        </div>
        <CommentInput onSubmit={handleNewComment} />
        <div className="mt-8">
       
          {comments.map(comment => (
            <Comment
              key={comment.comment_id ? comment.comment_id : "1sdfsd"}
              comment={comment}
              onLike={handleLike}
              onDislike={handleDislike}
              onReply={handleReply}
              onToggleCollapse={handleToggleCollapse}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
