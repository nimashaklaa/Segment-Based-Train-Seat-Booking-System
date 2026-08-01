package seed

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

const (
	routeID = "aaaaaaaa-0000-0000-0000-000000000001"

	stationColombFortID   = "bbbbbbbb-0000-0000-0000-000000000001"
	stationMaradanaID     = "bbbbbbbb-0000-0000-0000-000000000002"
	stationKelaniyaID     = "bbbbbbbb-0000-0000-0000-000000000003"
	stationVeyangodaID    = "bbbbbbbb-0000-0000-0000-000000000004"
	stationPolgahawelaID  = "bbbbbbbb-0000-0000-0000-000000000005"
	stationPeradeniyaID   = "bbbbbbbb-0000-0000-0000-000000000006"
	stationKandyID        = "bbbbbbbb-0000-0000-0000-000000000007"
	stationGampolaID      = "bbbbbbbb-0000-0000-0000-000000000008"
	stationNawalapitiyaID = "bbbbbbbb-0000-0000-0000-000000000009"
	stationHattonID       = "bbbbbbbb-0000-0000-0000-000000000010"
	stationTalawakeleID   = "bbbbbbbb-0000-0000-0000-000000000011"
	stationNanuOyaID      = "bbbbbbbb-0000-0000-0000-000000000012"
	stationHaputaleID     = "bbbbbbbb-0000-0000-0000-000000000013"
	stationBandarawelaID  = "bbbbbbbb-0000-0000-0000-000000000014"
	stationEllaID         = "bbbbbbbb-0000-0000-0000-000000000015"
	stationBadullaID      = "bbbbbbbb-0000-0000-0000-000000000016"

	coachTypeFirstID  = "cccccccc-0000-0000-0000-000000000001"
	coachTypeSecondID = "cccccccc-0000-0000-0000-000000000002"
	coachTypeThirdID  = "cccccccc-0000-0000-0000-000000000003"

	coachFC01ID = "dddddddd-0000-0000-0000-000000000001"
	coachSC01ID = "dddddddd-0000-0000-0000-000000000002"
	coachSC02ID = "dddddddd-0000-0000-0000-000000000003"
	coachTC01ID = "dddddddd-0000-0000-0000-000000000004"
	coachTC02ID = "dddddddd-0000-0000-0000-000000000005"
	coachTC03ID = "dddddddd-0000-0000-0000-000000000006"
	coachTC04ID = "dddddddd-0000-0000-0000-000000000007"
	coachTC05ID = "dddddddd-0000-0000-0000-000000000008"

	scheduleID = "eeeeeeee-0000-0000-0000-000000000001"
)

// Run populates the database with the Colombo Fort–Badulla route, stations,
// coaches, seats, schedule, and a journey for today. It is fully idempotent.
func Run(db *sql.DB) error {
	exec := func(query string, args ...any) error {
		_, err := db.Exec(query, args...)
		return err
	}

	log.Println("[seed] Seeding route...")
	if err := exec(`INSERT INTO routes (id, name, code, origin, destination)
		VALUES ($1, 'Colombo Fort - Badulla', 'CMB-BDL', 'Colombo Fort', 'Badulla')
		ON CONFLICT (code) DO NOTHING`, routeID); err != nil {
		return fmt.Errorf("route: %w", err)
	}

	log.Println("[seed] Seeding stations...")
	stations := []struct {
		id       string
		name     string
		seq      int
		distance float64
	}{
		{stationColombFortID, "Colombo Fort", 1, 0.0},
		{stationMaradanaID, "Maradana", 2, 2.0},
		{stationKelaniyaID, "Kelaniya", 3, 10.5},
		{stationVeyangodaID, "Veyangoda", 4, 37.0},
		{stationPolgahawelaID, "Polgahawela", 5, 82.0},
		{stationPeradeniyaID, "Peradeniya", 6, 116.0},
		{stationKandyID, "Kandy", 7, 121.0},
		{stationGampolaID, "Gampola", 8, 132.0},
		{stationNawalapitiyaID, "Nawalapitiya", 9, 152.0},
		{stationHattonID, "Hatton", 10, 184.0},
		{stationTalawakeleID, "Talawakele", 11, 200.0},
		{stationNanuOyaID, "Nanu Oya", 12, 214.0},
		{stationHaputaleID, "Haputale", 13, 257.0},
		{stationBandarawelaID, "Bandarawela", 14, 266.0},
		{stationEllaID, "Ella", 15, 278.0},
		{stationBadullaID, "Badulla", 16, 292.0},
	}
	for _, s := range stations {
		if err := exec(`INSERT INTO stations (id, route_id, name, sequence_order, distance_from_origin_km)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (route_id, sequence_order) DO NOTHING`,
			s.id, routeID, s.name, s.seq, s.distance); err != nil {
			return fmt.Errorf("station %s: %w", s.name, err)
		}
	}

	log.Println("[seed] Seeding coach types...")
	coachTypes := []struct {
		id       string
		name     string
		reserved bool
		capacity int
	}{
		{coachTypeFirstID, "First Class", true, 24},
		{coachTypeSecondID, "Second Class", true, 30},
		{coachTypeThirdID, "Third Class", false, 0},
	}
	for _, ct := range coachTypes {
		if err := exec(`INSERT INTO coach_types (id, name, is_reserved, seat_capacity)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (id) DO NOTHING`,
			ct.id, ct.name, ct.reserved, ct.capacity); err != nil {
			return fmt.Errorf("coach type %s: %w", ct.name, err)
		}
	}

	log.Println("[seed] Seeding coaches (3 reserved + 5 unreserved)...")
	coaches := []struct {
		id          string
		number      string
		coachTypeID string
	}{
		{coachFC01ID, "FC-01", coachTypeFirstID},
		{coachSC01ID, "SC-01", coachTypeSecondID},
		{coachSC02ID, "SC-02", coachTypeSecondID},
		{coachTC01ID, "TC-01", coachTypeThirdID},
		{coachTC02ID, "TC-02", coachTypeThirdID},
		{coachTC03ID, "TC-03", coachTypeThirdID},
		{coachTC04ID, "TC-04", coachTypeThirdID},
		{coachTC05ID, "TC-05", coachTypeThirdID},
	}
	for _, c := range coaches {
		if err := exec(`INSERT INTO coaches (id, coach_number, coach_type_id)
			VALUES ($1, $2, $3)
			ON CONFLICT (id) DO NOTHING`,
			c.id, c.number, c.coachTypeID); err != nil {
			return fmt.Errorf("coach %s: %w", c.number, err)
		}
	}

	// Unreserved coaches are first-come-first-served — no seat records needed.
	log.Println("[seed] Seeding seats for reserved coaches...")
	layouts := []struct {
		coachID string
		rows    int
		cols    []string
	}{
		{coachFC01ID, 6, []string{"A", "B", "C", "D"}},
		{coachSC01ID, 6, []string{"A", "B", "C", "D", "E"}},
		{coachSC02ID, 6, []string{"A", "B", "C", "D", "E"}},
	}
	seatIndex := 1
	totalSeats := 0
	for _, layout := range layouts {
		for row := 1; row <= layout.rows; row++ {
			for colIdx, col := range layout.cols {
				seatNum := fmt.Sprintf("%d%s", row, col)
				seatUUID := fmt.Sprintf("ffffffff-0000-0000-%04d-%012d", seatIndex, seatIndex)
				if err := exec(`INSERT INTO seats (id, coach_id, seat_number, row_num, col_num)
					VALUES ($1, $2, $3, $4, $5)
					ON CONFLICT (coach_id, seat_number) DO NOTHING`,
					seatUUID, layout.coachID, seatNum, row, colIdx+1); err != nil {
					return fmt.Errorf("seat %s/%s: %w", layout.coachID, seatNum, err)
				}
				seatIndex++
				totalSeats++
			}
		}
	}

	log.Println("[seed] Seeding train schedule (Udarata Menike #1005, 05:55)...")
	departure := time.Date(0, 1, 1, 5, 55, 0, 0, time.UTC)
	if err := exec(`INSERT INTO train_schedules (id, train_number, route_id, departure_time)
		VALUES ($1, '1005', $2, $3)
		ON CONFLICT (train_number) DO NOTHING`,
		scheduleID, routeID, departure); err != nil {
		return fmt.Errorf("schedule: %w", err)
	}

	log.Println("[seed] Seeding journey for today...")
	today := time.Now().UTC().Truncate(24 * time.Hour)
	if err := exec(`INSERT INTO train_journeys (schedule_id, travel_date, status)
		VALUES ($1, $2, 'SCHEDULED')
		ON CONFLICT (schedule_id, travel_date) DO NOTHING`,
		scheduleID, today); err != nil {
		return fmt.Errorf("journey: %w", err)
	}

	log.Printf("[seed] Done — 1 route, %d stations, 3 coach types, %d coaches, %d seats, 1 schedule, 1 journey.",
		len(stations), len(coaches), totalSeats)
	return nil
}
