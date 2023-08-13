import Thread from './Thread';

export default interface User {
    _id: string;
    bio: string;
    name: string;
    image: string;
    id: string;
    communities: {
        id: string;
        name: string;
        image: string;
    }[];
    onboarded: boolean;
    username: string;
    threads: Thread[];
  };