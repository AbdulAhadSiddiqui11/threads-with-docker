import PostThread from "@/components/forms/PostThread";
import { fetchUser } from "@/lib/actions/user.action";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

async function CreateThreadPage() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const userInfo = await fetchUser(user.id);

    if (!userInfo?.onboarded) {
        redirect("/onboarding");
    }

    return (
        <>
            <h1 className="head-text">Create Thread</h1>
            {/* userInfo._id is the mongoDB id for this user -> to be mapped to posts/communities */}
            <PostThread userId={userInfo._id} />
        </>
    );
};

export default CreateThreadPage;