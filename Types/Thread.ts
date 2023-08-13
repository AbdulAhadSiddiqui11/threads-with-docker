import User from './User';
import Community from './Community';

export default interface Thread {
    _id: string;
    parentId: string | null;
    text: string;
    author: User;
    community: Community | null;
    createdAt: string;
    children: Thread[];
};