import { fetchUserThreads } from "@/lib/actions/user.action";
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";

interface ThreadsTabProps {
    currentUserId: string;
    accountId: string;
    accountType: string;
}

const ThreadsTab = async (userDetails : ThreadsTabProps) => {

    const { currentUserId, accountId, accountType } = userDetails;

    const results = await fetchUserThreads(accountId);
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
                    community={thread.community}
                    createdAt={thread.createdAt}
                    comments={thread.children}
                />
            ))}
        </section>
    );
}


export default ThreadsTab;