import { fetchUserThreads } from "@/lib/actions/user.action";
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";

interface ThreadsTabProps {
    currentUserId: string;
    accountId: string;
    accountType: string;
}

interface ThreadsTabResults {
    name: string;
    image: string;
    id: string;
    threads: {
      _id: string;
      text: string;
      parentId: string | null;
      author: {
        name: string;
        image: string;
        id: string;
      };
      community: {
        id: string;
        name: string;
        image: string;
      } | null;
      createdAt: string;
      children: {
        author: {
          image: string;
        };
      }[];
    }[];
}

const ThreadsTab = async (userDetails : ThreadsTabProps) => {

    const {currentUserId, accountId, accountType } = userDetails;
    let results: ThreadsTabResults;

    if(accountType === 'Community') {
        results = await fetchCommunityPosts(accountId);
    } else {
        results = await fetchUserThreads(accountId);
    }

    if(!results) {
        redirect('/');
    }

    return (
        <section className="mt-9 flex flex-col gap-10">
            {results.threads.map((thread: any) => (
                <ThreadCard 
                    key={thread._id} 
                    id={thread._id} 
                    currentUserId={currentUserId}
                    parentId={thread.parentId}
                    content={thread.text}
                    author={accountType === 'User' ? 
                            {name: results.name, image: results.image, id: results.id} 
                            : {name: thread.author.name, image: thread.author.image, id: thread.author.id}}
                    community={
                        accountType === "Community"
                            ? { name: results.name, id: results.id, image: results.image }
                            : thread.community
                        }
                    createdAt={thread.createdAt}
                    comments={thread.children}
                />
            ))}
        </section>
    );
}


export default ThreadsTab;