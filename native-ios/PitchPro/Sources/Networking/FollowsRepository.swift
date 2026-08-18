import Foundation
import Supabase

private struct NewFollow: Encodable {
    let follower_id: String
    let following_id: String
}

/// Même table que le site web (public.follows) : suivre un joueur ou un coach
/// débloque la messagerie avec lui (voir can_message() côté base).
enum FollowsRepository {
    static func isFollowing(follower: String, following: String) async throws -> Bool {
        let count = try await supabase
            .from("follows")
            .select("follower_id", head: true, count: .exact)
            .eq("follower_id", value: follower)
            .eq("following_id", value: following)
            .execute()
            .count
        return (count ?? 0) > 0
    }

    static func follow(follower: String, following: String) async throws {
        try await supabase
            .from("follows")
            .insert(NewFollow(follower_id: follower, following_id: following))
            .execute()
    }

    static func unfollow(follower: String, following: String) async throws {
        try await supabase
            .from("follows")
            .delete()
            .eq("follower_id", value: follower)
            .eq("following_id", value: following)
            .execute()
    }

    static func counts(userId: String) async throws -> (followers: Int, following: Int) {
        async let followersCount = supabase
            .from("follows")
            .select("follower_id", head: true, count: .exact)
            .eq("following_id", value: userId)
            .execute()
            .count
        async let followingCount = supabase
            .from("follows")
            .select("following_id", head: true, count: .exact)
            .eq("follower_id", value: userId)
            .execute()
            .count
        let (followers, following) = try await (followersCount, followingCount)
        return (followers ?? 0, following ?? 0)
    }
}
