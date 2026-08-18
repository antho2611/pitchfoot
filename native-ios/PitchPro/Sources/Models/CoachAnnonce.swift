import Foundation

struct CoachAnnonce: Identifiable, Codable {
    let id: String
    let title: String
    let city: String?
    let location: String?
    let sessionDate: String
    let startTime: String?
    let endTime: String?
    let status: String
    let description: String?
    let priceInfo: String?
    let capacity: Int?
    let reservedCount: Int

    enum CodingKeys: String, CodingKey {
        case id, title, city, location, status, description, capacity
        case sessionDate = "session_date"
        case startTime = "start_time"
        case endTime = "end_time"
        case priceInfo = "price_info"
        case reservedCount = "reserved_count"
    }
}
