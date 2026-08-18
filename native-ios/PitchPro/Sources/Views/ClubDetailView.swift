import SwiftUI

struct ClubDetailView: View {
    let clubId: String

    @State private var club: Club?
    @State private var listings: [Listing] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if let errorMessage {
                Text(errorMessage).foregroundStyle(.secondary).padding(.top, 60)
            } else if let club {
                content(for: club)
                    .frame(maxWidth: 700)
                    .frame(maxWidth: .infinity)
            }
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    @ViewBuilder
    private func content(for club: Club) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            AsyncImage(url: club.logoURL.flatMap(URL.init)) { image in
                image.resizable().scaledToFit()
            } placeholder: {
                Color.secondary.opacity(0.1)
            }
            .frame(height: 160)
            .frame(maxWidth: .infinity)
            .background(Color.secondary.opacity(0.05))

            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text(club.name.uppercased()).font(.pitchDisplay(34))
                    if club.isVerified {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(Color.pitchGreen)
                    }
                }

                let subtitle = [club.stadium, club.championship, club.level, club.city]
                    .compactMap { $0 }
                    .joined(separator: " · ")
                if !subtitle.isEmpty {
                    LabelXS(text: subtitle)
                }

                if let description = club.description, !description.isEmpty {
                    Text(description).font(.body).foregroundStyle(.secondary)
                }

                if !listings.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("ANNONCES OUVERTES").font(.pitchDisplay(22))
                        VStack(spacing: 8) {
                            ForEach(listings) { listing in
                                NavigationLink {
                                    AnnonceDetailView(listingId: listing.id)
                                } label: {
                                    PitchCard {
                                        HStack {
                                            Text(listing.title.uppercased()).font(.pitchDisplay(16))
                                            Spacer()
                                            Image(systemName: "chevron.right")
                                                .font(.caption2)
                                                .foregroundStyle(.tertiary)
                                        }
                                    }
                                }
                                .foregroundStyle(.primary)
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            async let clubTask = ClubsRepository.fetchOne(id: clubId)
            async let listingsTask = ListingsRepository.fetchOpenForClub(clubId: clubId)
            let (fetchedClub, fetchedListings) = try await (clubTask, listingsTask)
            club = fetchedClub
            listings = fetchedListings
        } catch {
            errorMessage = "Fiche club indisponible."
        }
        isLoading = false
    }
}
