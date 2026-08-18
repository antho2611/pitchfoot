import SwiftUI

/// Bouton "Suivre / Abonné" façon Insta — coins nets, couleurs PitchPro,
/// équivalent de src/components/FollowButton.tsx sur le site.
struct FollowButton: View {
    let targetId: String
    var targetName: String? = nil

    @EnvironmentObject private var session: SessionStore
    @State private var following = false
    @State private var isLoading = true
    @State private var pending = false

    private var myId: String? { session.session?.user.id.uuidString }

    var body: some View {
        if let myId, myId != targetId {
            Button {
                Task { await toggle(myId: myId) }
            } label: {
                HStack(spacing: 6) {
                    if pending {
                        ProgressView().tint(following ? Color.pitchGreen : Color.pitchVolt)
                    } else {
                        Image(systemName: following ? "checkmark" : "plus")
                            .font(.system(size: 12, weight: .bold))
                        Text(following ? "Abonné" : "Suivre")
                    }
                }
                .font(.system(size: 14, weight: .bold))
                .padding(.horizontal, 16)
                .padding(.vertical, 9)
                .foregroundStyle(following ? Color.pitchGreen : Color.pitchVolt)
                .background(following ? Color.clear : Color.pitchGreen)
                .overlay(Rectangle().strokeBorder(Color.pitchGreen, lineWidth: following ? 1.5 : 0))
            }
            .buttonStyle(.plain)
            .disabled(isLoading || pending)
            .task(id: myId) { await load(myId: myId) }
        }
    }

    private func load(myId: String) async {
        isLoading = true
        following = (try? await FollowsRepository.isFollowing(follower: myId, following: targetId)) ?? false
        isLoading = false
    }

    private func toggle(myId: String) async {
        pending = true
        do {
            if following {
                try await FollowsRepository.unfollow(follower: myId, following: targetId)
                following = false
            } else {
                try await FollowsRepository.follow(follower: myId, following: targetId)
                following = true
            }
        } catch {
            // La requête a échoué (réseau…) : on laisse l'état affiché inchangé.
        }
        pending = false
    }
}

/// "128 abonnés · 12 abonnements", équivalent de <FollowCounts> sur le web.
struct FollowCounts: View {
    let userId: String

    @State private var followers = 0
    @State private var following = 0

    var body: some View {
        Text("\(followers) abonnés · \(following) abonnements")
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(.secondary)
            .task(id: userId) {
                if let counts = try? await FollowsRepository.counts(userId: userId) {
                    followers = counts.followers
                    following = counts.following
                }
            }
    }
}
