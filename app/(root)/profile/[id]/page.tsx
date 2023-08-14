import PostThread from "@/components/forms/PostThread";
import { fetchUser } from "@/lib/actions/user.action";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";


import exp from "constants";
import ProfileHeader from "@/components/shared/ProfileHeader";

const ProfilePage = async ({ params }: { params : { id: string}}) => {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const userInfo = await fetchUser(params.id);

    if (!userInfo?.onboarded) {
        redirect("/onboarding");
    }

    return (
        <section>
            <ProfileHeader 
                accountId={userInfo._id}
                authUserId={user.id}
                name={userInfo.name}
                username={userInfo.username}
                imgUrl={userInfo.image}
                bio={userInfo.bio}
            />
        </section>
    );
}

export default ProfilePage;