import { fetchUser, fetchUsers } from "@/lib/actions/user.action";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Image from "next/image";
import UserCard from "@/components/cards/UserCard";
import { fetchCommunities } from "@/lib/actions/community.actions";
import CommunityCard from "@/components/cards/CommunityCard";
import Searchbar from "@/components/shared/Searchbar";
import Pagination from "@/components/shared/Pagination";


const CommunitiesPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const results = await fetchCommunities({
        searchString: searchParams.q,
        pageNumber: searchParams?.page ? +searchParams.page : 1,
        pageSize: 10,
    });

    return (
        <>
            <section>
                <h1 className="head-text mb-10">Search</h1>

                <div className='mt-5'>
                    <Searchbar routeType='communities' />
                </div>

                <div className="mt-14 flex flex-col gap-9">
                    {results.communities.length === 0 ? (
                        <p className="no-result">No users</p>
                    ) : (
                        <>
                            {results.communities.map((community) => (
                                <CommunityCard 
                                    key={community.id}
                                    id={community.id}
                                    name={community.name}
                                    username={community.username}
                                    imgUrl={community.image}
                                    bio={community.bio}
                                    members={community.members}
                                />
                            ))}
                        </>
                    )}
                </div>
            </section>
            <Pagination
                path='communities'
                pageNumber={searchParams?.page ? +searchParams.page : 1}
                isNext={results.isNext}
            />
        </>
    );
}

export default CommunitiesPage;