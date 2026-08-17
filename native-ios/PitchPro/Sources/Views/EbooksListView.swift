import SwiftUI

struct EbooksListView: View {
    var body: some View {
        AsyncListView(
            title: "Ebooks",
            emptyMessage: "Aucun ebook disponible",
            emptySymbol: "book",
            load: EbooksRepository.fetchPublished
        ) { ebook in
            HStack(alignment: .top, spacing: 12) {
                AsyncImage(url: ebook.coverURL.flatMap(URL.init)) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.secondary.opacity(0.15)
                }
                .frame(width: 56, height: 76)
                .clipped()

                VStack(alignment: .leading, spacing: 4) {
                    LabelXS(text: ebook.category, color: Color.pitchGreen)
                    Text(ebook.title.uppercased())
                        .font(.pitchDisplay(20))
                    Text(ebook.summary)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                    Text(ebook.priceLabel)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color.pitchGreen)
                }
            }
        }
    }
}
