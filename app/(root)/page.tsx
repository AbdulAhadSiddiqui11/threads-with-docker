import ThreadCard from "@/components/cards/ThreadCard";
import { fetchThreads } from "@/lib/actions/thread.action";
import { fetchUser } from "@/lib/actions/user.action";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-up");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const fetchedThreads = await fetchThreads(1, 30);

  return (
    <>
      <h1 className="head-text text-left">
        Home
      </h1>

      <section className="mt-9 flex flex-col gap-10">
        {fetchedThreads.threads.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {fetchedThreads.threads.map((thread) => (
              <ThreadCard 
                key={thread._id} 
                id={thread._id} 
                currentUserId={user?.id || ''}
                parentId={thread.parentId}
                content={thread.text}
                author={thread.author}
                community={thread.community}
                createdAt={thread.createdAt}
                comments={thread.children}
              />
            ))}
          </>
        )}
      </section>
    </>
  );
}