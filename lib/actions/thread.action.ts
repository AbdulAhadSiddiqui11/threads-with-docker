'use server';

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import { connectToDatabase } from "../mongoose";
import User from "../models/user.model";


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

        const createdThread = await Thread.create({text, author, community: null});

        // Update User Model -> Check the user model, it has references to list of threads
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id },
        });

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
                                    .populate({ path: 'author', model: User })
                                    .populate({ 
                                        path: 'children',
                                        populate: {
                                            path: 'author',
                                            model: User,
                                            select: '_id name parentId image'
                                        }
                                    });

        const totalThreadsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });

        const threads = await threadQuery.exec();

        const isNext = (totalThreadsCount) > (skipAmount + threads.length);

        return { threads, isNext };

    } catch (error: any) {
        throw new Error(`Error fetching threads: ${error.message}`);
    }
}