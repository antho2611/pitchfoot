import Foundation

struct CoachAnnonce: Identifiable, Codable {
    let id: String
    let title: String
    let city: String?
    let location: String?
    let sessionDate: String
    let startTime: String?
    let status: String

    enum CodingKeys: String, CodingKey {
        case id, title, city, location, status
        case sessionDate = "session_date"
        case startTime = "start_time"
    }
}
