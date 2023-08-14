'use server';

import User from "@/lib/models/user.model";

import { connectToDatabase } from "../mongoose";
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";
import { skip } from "node:test";

interface UserActionParams {
    userId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
    path: string;
};

export async function updateUser(userDetails: UserActionParams): Promise<void> {
    connectToDatabase();

    const { userId, username, name, bio, image, path } = userDetails;

    try{
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name,
                bio,
                image,
                onboarded: true,
            },
            { upsert: true },
        );

        if(path === '/profile/edit') {
            revalidatePath(path);
        }
    } catch (error: any) {
        throw new Error(`Error updating user: ${error.message}`);
    }
}

export async function fetchUser(userId: string) {
    try {
        connectToDatabase();

        return await User
                        .findOne({ id: userId })
                        // .populate({
                        //     path: 'communities',
                        //     model: 'Community',
                        // });

    } catch (error: any) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
}

export async function fetchUserThreads(userId: string) {
    try {
        connectToDatabase();

        const threads = await User.findOne({ id: userId })
                                    .populate({
                                        path: 'threads',
                                        model: Thread,
                                        populate: {
                                            path: 'children',
                                            model: Thread,
                                            populate: {
                                                path: 'author',
                                                model: User,
                                                select: 'name image id',
                                            }
                                        }
                                    });
        return threads;
    } catch (error: any) {
        throw new Error(`Error fetching user threads: ${error.message}`);
    }
}


interface FetchUserParams {
    userId: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
}

export async function fetchUsers({
    userId,
    searchString = '',
    pageNumber = 1,
    pageSize = 20,
    sortBy = 'desc',
}: FetchUserParams) {
    try {
        connectToDatabase();

        const skipAmount = (pageNumber - 1) * pageSize;

        const regex = new RegExp(searchString, 'i');

        const query: FilterQuery<typeof User> = {
            id: { $ne: userId },
        };

        if (searchString.trim() !== '') {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } },
            ];
        }

        const sortOptions = { createdAt: sortBy };

        const usersQuery = User.find(query)
                                .sort(sortOptions)
                                .skip(skipAmount)
                                .limit(pageSize);

        const totalUserCount = await User.countDocuments(query);

        const users = await usersQuery.exec();

        const isNext = totalUserCount > skipAmount + users.length;

        return { users, isNext };

    } catch (error: any) {
        throw new Error(`Error fetching users: ${error.message}`);
    }
}