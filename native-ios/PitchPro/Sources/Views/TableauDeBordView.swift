import SwiftUI

/// Équivalent de src/routes/_authenticated/tableau-de-bord.tsx : un tableau de
/// bord différent selon account_type (joueur / club / coach / admin).
struct TableauDeBordView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var profile: AccountProfile?
    @State private var isLoading = true

    private var myId: String? { session.session?.user.id.uuidString.lowercased() }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 2) {
                    LabelXS(text: sectionLabel)
                    Text((profile?.displayName.isEmpty == false ? profile!.displayName : "Bienvenue").uppercased())
                        .font(.pitchDisplay(34))
                }
                .padding(.horizontal)
                .padding(.top, 8)

                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else if let myId {
                    switch profile?.accountType {
                    case "club":
                        DashClub(userId: myId)
                    case "coach":
                        DashCoach(userId: myId)
                    case "admin":
                        DashAdmin()
                    default:
                        DashPlayer(userId: myId)
                    }
                }
            }
            .padding(.bottom, 24)
        }
        .frame(maxWidth: 700)
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var sectionLabel: String {
        switch profile?.accountType {
        case "club": return "Espace club"
        case "admin": return "Admin"
        case "coach": return "Espace préparateur"
        default: return "Espace joueur"
        }
    }

    private func load() async {
        guard let myId else { isLoading = false; return }
        isLoading = true
        profile = try? await ProfileRepository.fetchMine(userId: myId)
        isLoading = false
    }
}

private struct DashStat: View {
    let icon: String
    let label: String
    let value: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(Color.pitchGreen)
            LabelXS(text: label)
            Text("\(value)").font(.pitchDisplay(30))
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(Rectangle().strokeBorder(Color.secondary.opacity(0.15)))
    }
}

private let statGrid = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]

// MARK: - Joueur

private struct DashPlayer: View {
    let userId: String

    @State private var player: Player?
    @State private var applications: [Application] = []
    @State private var listingsById: [String: Listing] = [:]
    @State private var clubsById: [String: Club] = [:]
    @State private var views = 0
    @State private var saved = 0
    @State private var isLoading = true

    private var completion: Int {
        guard let p = player else { return 0 }
        var filled = 0
        let total = 8
        if !p.firstName.isEmpty { filled += 1 }
        if !p.lastName.isEmpty { filled += 1 }
        if p.mainPosition?.isEmpty == false { filled += 1 }
        if p.birthDate?.isEmpty == false { filled += 1 }
        if p.city?.isEmpty == false { filled += 1 }
        if p.level?.isEmpty == false { filled += 1 }
        if p.bio?.isEmpty == false { filled += 1 }
        if p.photoURL?.isEmpty == false { filled += 1 }
        return Int((Double(filled) / Double(total) * 100).rounded())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 20)
            } else {
                LazyVGrid(columns: statGrid, spacing: 10) {
                    DashStat(icon: "eye", label: "Vues du profil", value: views)
                    DashStat(icon: "person.2", label: "Clubs intéressés", value: saved)
                    DashStat(icon: "doc.text", label: "Candidatures", value: applications.count)
                }

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("PROFIL COMPLÉTÉ").font(.pitchDisplay(20))
                        Spacer()
                        Text("\(completion)%").font(.pitchDisplay(20))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Rectangle().fill(Color.secondary.opacity(0.15))
                            Rectangle().fill(Color.pitchVolt).frame(width: geo.size.width * CGFloat(completion) / 100)
                        }
                    }
                    .frame(height: 8)
                }
                .padding(14)
                .overlay(Rectangle().strokeBorder(Color.secondary.opacity(0.15)))

                VStack(alignment: .leading, spacing: 10) {
                    Text("MES CANDIDATURES").font(.pitchDisplay(24))
                    if applications.isEmpty {
                        Text("Aucune candidature.").font(.subheadline).foregroundStyle(.secondary)
                    } else {
                        VStack(spacing: 8) {
                            ForEach(applications) { app in
                                PitchCard {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text((listingsById[app.listingId]?.title ?? "Annonce").uppercased())
                                                .font(.pitchDisplay(16))
                                            LabelXS(text: clubsById[app.clubId]?.name ?? "Club")
                                        }
                                        Spacer()
                                        LabelXS(text: app.status)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(.horizontal)
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        async let playerTask = PlayersRepository.fetchOne(id: userId)
        async let appsTask = DashboardRepository.applicationsForPlayer(playerId: userId)
        async let viewsTask = DashboardRepository.profileViewsCount(playerId: userId)
        async let savedTask = DashboardRepository.savedCountForPlayer(playerId: userId)
        player = try? await playerTask
        applications = (try? await appsTask) ?? []
        views = (try? await viewsTask) ?? 0
        saved = (try? await savedTask) ?? 0

        let listingIds = Array(Set(applications.map { $0.listingId }))
        let clubIds = Array(Set(applications.map { $0.clubId }))
        async let listingsTask = ListingsRepository.fetchMany(ids: listingIds)
        async let clubsTask = ClubsRepository.fetchMany(ids: clubIds)
        let listings = (try? await listingsTask) ?? []
        let clubs = (try? await clubsTask) ?? []
        listingsById = Dictionary(uniqueKeysWithValues: listings.map { ($0.id, $0) })
        clubsById = Dictionary(uniqueKeysWithValues: clubs.map { ($0.id, $0) })

        isLoading = false
    }
}

// MARK: - Club

private struct DashClub: View {
    let userId: String

    @State private var listings: [Listing] = []
    @State private var applications: [Application] = []
    @State private var saved: [SavedPlayer] = []
    @State private var playersById: [String: Player] = [:]
    @State private var listingsById: [String: Listing] = [:]
    @State private var isLoading = true
    @State private var pushedConversation: Conversation?

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 20)
            } else {
                LazyVGrid(columns: statGrid, spacing: 10) {
                    DashStat(icon: "doc.text", label: "Annonces", value: listings.count)
                    DashStat(icon: "tray", label: "Candidatures", value: applications.count)
                    DashStat(icon: "person.2", label: "Short-list", value: saved.count)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("MES ANNONCES").font(.pitchDisplay(24))
                    if listings.isEmpty {
                        Text("Aucune annonce publiée.").font(.subheadline).foregroundStyle(.secondary)
                    } else {
                        VStack(spacing: 8) {
                            ForEach(listings) { listing in
                                NavigationLink {
                                    AnnonceDetailView(listingId: listing.id)
                                } label: {
                                    PitchCard {
                                        HStack {
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(listing.title.uppercased()).font(.pitchDisplay(16))
                                                LabelXS(
                                                    text: [listing.position, listing.level, listing.city]
                                                        .compactMap { $0 }.joined(separator: " • ")
                                                )
                                            }
                                            Spacer()
                                            LabelXS(text: listing.isOpen ? "Ouverte" : "Fermée")
                                        }
                                    }
                                }
                                .foregroundStyle(.primary)
                            }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("CANDIDATURES REÇUES").font(.pitchDisplay(24))
                    if applications.isEmpty {
                        Text("Aucune candidature reçue.").font(.subheadline).foregroundStyle(.secondary)
                    } else {
                        VStack(spacing: 10) {
                            ForEach(applications) { app in applicationRow(app) }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("SHORT-LIST").font(.pitchDisplay(24))
                    if saved.isEmpty {
                        Text("Aucun joueur sauvegardé.").font(.subheadline).foregroundStyle(.secondary)
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            ForEach(saved) { s in
                                if let player = playersById[s.playerId] {
                                    NavigationLink { PlayerDetailView(playerId: player.id) } label: {
                                        PitchCard {
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text("\(player.firstName) \(player.lastName)".uppercased())
                                                    .font(.pitchDisplay(15))
                                                LabelXS(
                                                    text: [player.mainPosition, player.currentClub]
                                                        .compactMap { $0 }.joined(separator: " • ")
                                                )
                                            }
                                        }
                                    }
                                    .foregroundStyle(.primary)
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(.horizontal)
        .task { await load() }
        .navigationDestination(item: $pushedConversation) { conversation in
            ConversationThreadView(myId: userId, conversation: conversation)
        }
    }

    @ViewBuilder
    private func applicationRow(_ app: Application) -> some View {
        let player = playersById[app.playerId]
        PitchCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text((player.map { "\($0.firstName) \($0.lastName)" } ?? "Joueur").uppercased())
                            .font(.pitchDisplay(16))
                        LabelXS(
                            text: [player?.mainPosition, listingsById[app.listingId]?.title]
                                .compactMap { $0 }.joined(separator: " • ")
                        )
                    }
                    Spacer()
                    LabelXS(text: app.status)
                }
                if let message = app.message, !message.isEmpty {
                    Text(message).font(.footnote).foregroundStyle(.secondary)
                }
                HStack(spacing: 10) {
                    Button("Accepter") { Task { await setStatus(app, "acceptee") } }
                        .buttonStyle(PillButtonStyle())

                    Button("Refuser") { Task { await setStatus(app, "refusee") } }
                        .buttonStyle(PillButtonStyle(filled: false))

                    Button("Message") { Task { await message(player) } }
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color.pitchGreen)

                    if let player {
                        NavigationLink { PlayerDetailView(playerId: player.id) } label: {
                            Text("Profil")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(Color.pitchGreen)
                        }
                    }
                }
            }
        }
    }

    private func setStatus(_ app: Application, _ status: String) async {
        try? await DashboardRepository.setApplicationStatus(id: app.id, status: status)
        await load()
    }

    private func message(_ player: Player?) async {
        guard let player else { return }
        guard let cid = try? await MessagingRepository.openConversation(me: userId, other: player.id) else { return }
        pushedConversation = Conversation(
            id: cid,
            otherId: player.id,
            name: "\(player.firstName) \(player.lastName)",
            avatarURL: player.photoURL,
            preview: "",
            lastMessageAt: ""
        )
    }

    private func load() async {
        isLoading = true
        async let listingsTask = DashboardRepository.listingsForClub(clubId: userId)
        async let appsTask = DashboardRepository.applicationsForClub(clubId: userId)
        async let savedTask = DashboardRepository.savedPlayersForClub(clubId: userId)
        listings = (try? await listingsTask) ?? []
        applications = (try? await appsTask) ?? []
        saved = (try? await savedTask) ?? []

        listingsById = Dictionary(uniqueKeysWithValues: listings.map { ($0.id, $0) })

        let playerIds = Array(Set(applications.map { $0.playerId } + saved.map { $0.playerId }))
        let players = (try? await PlayersRepository.fetchMany(ids: playerIds)) ?? []
        playersById = Dictionary(uniqueKeysWithValues: players.map { ($0.id, $0) })

        isLoading = false
    }
}

// MARK: - Coach

private struct DashCoach: View {
    let userId: String

    @State private var coach: Preparateur?
    @State private var sessions: [CoachAnnonce] = []
    @State private var isLoading = true

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 20)
            } else {
                LazyVGrid(columns: statGrid, spacing: 10) {
                    DashStat(icon: "calendar", label: "Séances publiées", value: sessions.count)
                    DashStat(icon: "checkmark.circle", label: "Séances actives", value: sessions.filter { $0.status == "active" }.count)
                    DashStat(icon: "eye", label: "Vues du profil", value: coach?.viewsCount ?? 0)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("MES DERNIÈRES SÉANCES").font(.pitchDisplay(24))
                    if sessions.isEmpty {
                        Text("Publiez votre première séance depuis votre profil.")
                            .font(.subheadline).foregroundStyle(.secondary)
                    } else {
                        VStack(spacing: 8) {
                            ForEach(sessions.prefix(5)) { session in
                                NavigationLink { SeanceDetailView(session: session) } label: {
                                    PitchCard {
                                        HStack {
                                            Text(session.title.uppercased()).font(.pitchDisplay(16))
                                            Spacer()
                                            LabelXS(text: session.sessionDate)
                                        }
                                    }
                                }
                                .foregroundStyle(.primary)
                            }
                        }
                    }
                }

                NavigationLink {
                    PreparateurDetailView(preparateurId: userId)
                } label: {
                    Text("Voir ma fiche publique")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.pitchGreen)
                }
            }
        }
        .padding(.horizontal)
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        async let coachTask = PreparateursRepository.fetchOne(id: userId)
        async let sessionsTask = CoachAnnoncesRepository.fetchForCoach(coachId: userId)
        coach = try? await coachTask
        sessions = (try? await sessionsTask) ?? []
        isLoading = false
    }
}

// MARK: - Admin

private struct DashAdmin: View {
    var body: some View {
        PitchCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("CONSOLE D'ADMINISTRATION").font(.pitchDisplay(22))
                Text("La modération (profils, annonces, signalements) se fait depuis le site web pour l'instant.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if let url = URL(string: "https://pitchfoot.onrender.com/admin") {
                    Link("Ouvrir la console sur le site", destination: url)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.pitchGreen)
                }
            }
        }
        .padding(.horizontal)
    }
}
