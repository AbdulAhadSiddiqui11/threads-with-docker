'use server';

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../mongoose";
import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";


interface ThreadParams {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function createThread(threadDetails: ThreadParams) {
    const { text, author, communityId, path } = threadDetails;

    try {
        connectToDatabase();

        const communityIdObject = await Community.findOne(
            { id: communityId },
            { _id: 1 }
          );
      
          const createdThread = await Thread.create({
            text,
            author,
            community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
          });
      
          // Update User model
          await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id },
          });
      
          if (communityIdObject) {
            // Update Community model
            await Community.findByIdAndUpdate(communityIdObject, {
              $push: { threads: createdThread._id },
            });
          }
      
          revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Error creating thread: ${error.message}`);
    }
}

export async function fetchThreads(pageNumber = 1, pageSize = 20) {
    try {
        connectToDatabase();

        // Calculate the number of threads to skip, based on page number
        const skipAmount = (pageNumber - 1) * pageSize;

        // Fetch the threads that dont have parents, meaning only fetch the top level threads and not comments
        const threadQuery = Thread.find({ parentId: { $in: [null, undefined] } })
                                    .sort({ createdAt: 'desc' })
                                    .skip(skipAmount)
                                    .limit(pageSize)
                                    .populate({
                                        path: "author",
                                        model: User,
                                      })
                                      .populate({
                                        path: "community",
                                        model: Community,
                                      })
                                      .populate({
                                        path: "children", // Populate the children field
                                        populate: {
                                          path: "author", // Populate the author field within children
                                          model: User,
                                          select: "_id name parentId image", // Select only _id and username fields of the author
                                        },
                                      });

        const totalThreadsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });

        const threads = await threadQuery.exec();

        const isNext = (totalThreadsCount) > (skipAmount + threads.length);

        return { threads, isNext };

    } catch (error: any) {
        throw new Error(`Error fetching threads: ${error.message}`);
    }
}

export async function fetchThreadById(threadId: string) {
    try {
        connectToDatabase();
        const thread = await Thread.findById(threadId)
                                    .populate({ 
                                        path: 'author', 
                                        model: User, 
                                        select: '_id id name image' 
                                    })
                                    .populate({
                                        path: "community",
                                        model: Community,
                                        select: "_id id name image",
                                        }) // Populate the community field with _id and name
                                        .populate({
                                        path: "children", // Populate the children field
                                        populate: [
                                            {
                                            path: "author", // Populate the author field within children
                                            model: User,
                                            select: "_id id name parentId image", // Select only _id and username fields of the author
                                            },
                                            {
                                            path: "children", // Populate the children field within children
                                            model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
                                            populate: {
                                                path: "author", // Populate the author field within nested children
                                                model: User,
                                                select: "_id id name parentId image", // Select only _id and username fields of the author
                                            },
                                            },
                                        ],
                                    })
                                    .exec();
        return thread;
    } catch (error: any) {
        throw new Error(`Error fetching thread by id: ${error.message}`);
    }
}

export async function addCommentToThread (threadId: string, commentText: string, userId: string, path: string) {
    try {
        connectToDatabase();

        // Find the original thread by its ID
        const originalThread = await Thread.findById(threadId);

        if (!originalThread) {
        throw new Error("Thread not found");
        }

        // Create the new comment thread
        const commentThread = new Thread({
        text: commentText,
        author: userId,
        parentId: threadId, // Set the parentId to the original thread's ID
        });

        // Save the comment thread to the database
        const savedCommentThread = await commentThread.save();

        // Add the comment thread's ID to the original thread's children array
        originalThread.children.push(savedCommentThread._id);

        // Save the updated original thread to the database
        await originalThread.save();

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Error adding comment to thread: ${error.message}`);
    }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
    const childThreads = await Thread.find({ parentId: threadId });

    const descendantThreads = [];
    for (const childThread of childThreads) {
        const descendants = await fetchAllChildThreads(childThread._id);
        descendantThreads.push(childThread, ...descendants);
    }

    return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
    try {
            connectToDatabase();

            // Find the thread to be deleted (the main thread)
            const mainThread = await Thread.findById(id).populate("author community");

            if (!mainThread) {
            throw new Error("Thread not found");
            }

            // Fetch all child threads and their descendants recursively
            const descendantThreads = await fetchAllChildThreads(id);

            // Get all descendant thread IDs including the main thread ID and child thread IDs
            const descendantThreadIds = [
            id,
            ...descendantThreads.map((thread) => thread._id),
            ];

            // Extract the authorIds and communityIds to update User and Community models respectively
            const uniqueAuthorIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
                mainThread.author?._id?.toString(),
            ].filter((id) => id !== undefined)
            );

            const uniqueCommunityIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
                mainThread.community?._id?.toString(),
            ].filter((id) => id !== undefined)
            );

            // Recursively delete child threads and their descendants
            await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

            // Update User model
            await User.updateMany(
            { _id: { $in: Array.from(uniqueAuthorIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
            );

            // Update Community model
            await Community.updateMany(
            { _id: { $in: Array.from(uniqueCommunityIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
            );

            revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to delete thread: ${error.message}`);
    }
}