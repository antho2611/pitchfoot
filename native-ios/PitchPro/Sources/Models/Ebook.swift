import Foundation

struct Ebook: Identifiable, Codable {
    let id: String
    let title: String
    let summary: String
    let category: String
    let priceCents: Int
    let isFree: Bool
    let coverURL: String?
    let previewText: String?
    let contentURL: String?

    enum CodingKeys: String, CodingKey {
        case id, title, summary, category
        case priceCents = "price_cents"
        case isFree = "is_free"
        case coverURL = "cover_url"
        case previewText = "preview_text"
        case contentURL = "content_url"
    }

    var priceLabel: String {
        isFree ? "Gratuit" : String(format: "%.2f €", Double(priceCents) / 100).replacingOccurrences(of: ".", with: ",")
    }
}
