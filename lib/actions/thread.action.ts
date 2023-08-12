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