package main

import (
	"database/sql"
	"log"
	"time"
)

// startJourneyScheduler rolls journeys forward daily, keeping a 30-day window
// of SCHEDULED journeys for every train schedule in the database.
func startJourneyScheduler(database *sql.DB) {
	rollJourneys(database) // run once immediately on startup
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			rollJourneys(database)
		}
	}()
}

func rollJourneys(database *sql.DB) {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	rows, err := database.Query(`SELECT id FROM train_schedules`)
	if err != nil {
		log.Printf("[scheduler] failed to list schedules: %v", err)
		return
	}
	defer rows.Close()

	var scheduleIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err == nil {
			scheduleIDs = append(scheduleIDs, id)
		}
	}

	count := 0
	for day := 0; day < 30; day++ {
		date := today.AddDate(0, 0, day)
		for _, sid := range scheduleIDs {
			_, err := database.Exec(
				`INSERT INTO train_journeys (schedule_id, travel_date, status)
				 VALUES ($1, $2, 'SCHEDULED')
				 ON CONFLICT (schedule_id, travel_date) DO NOTHING`,
				sid, date,
			)
			if err != nil {
				log.Printf("[scheduler] failed to insert journey %s on %s: %v", sid, date.Format("2006-01-02"), err)
			} else {
				count++
			}
		}
	}
	log.Printf("[scheduler] rolled journeys forward — %d upserted for next 30 days", count)
}
