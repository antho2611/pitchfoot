import SwiftUI

/// Bouton "Suivre / Abonné" façon Insta — pilule arrondie, couleurs PitchPro,
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
                if pending {
                    ProgressView().tint(following ? Color.primary : Color.pitchVolt)
                } else {
                    Label(following ? "Abonné" : "Suivre", systemImage: following ? "checkmark" : "plus")
                }
            }
            .buttonStyle(PillButtonStyle(filled: !following))
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
