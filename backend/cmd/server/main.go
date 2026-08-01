package main

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
	"github.com/nimashaklaa/train-seat-booking/internal/handler"
	"github.com/nimashaklaa/train-seat-booking/internal/mailer"
	"github.com/nimashaklaa/train-seat-booking/internal/seed"
	"github.com/nimashaklaa/train-seat-booking/internal/service"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:password@localhost:5432/train_booking?sslmode=disable"
	}

	fareRatePerKm := 2.50
	if v := os.Getenv("FARE_RATE_PER_KM"); v != "" {
		if parsed, err := strconv.ParseFloat(v, 64); err == nil {
			fareRatePerKm = parsed
		}
	}

	smtpHost := os.Getenv("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = "localhost"
	}
	smtpPort := os.Getenv("SMTP_PORT")
	if smtpPort == "" {
		smtpPort = "1025"
	}
	smtpFrom := os.Getenv("SMTP_FROM")
	if smtpFrom == "" {
		smtpFrom = "noreply@trainbooking.local"
	}

	database, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to open DB connection: %v", err)
	}
	defer func() {
		if err := database.Close(); err != nil {
			log.Printf("Error closing database connection: %v\n", err)
		}
	}()

	if err := database.Ping(); err != nil {
		log.Fatalf("Failed to ping DB: %v", err)
	}
	log.Println("Successfully connected to PostgreSQL database")

	log.Println("Running database migrations...")
	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Migrations applied successfully")

	if os.Getenv("SEED_ON_STARTUP") == "true" {
		if err := seed.Run(database); err != nil {
			log.Fatalf("Failed to seed database: %v", err)
		}
	}

	queries := db.New(database)
	mail := mailer.New(smtpHost, smtpPort, smtpFrom)
	svc := service.New(queries, fareRatePerKm)
	h := handler.New(svc)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	r.Get("/stations", h.ListStations)
	r.Get("/coaches", h.ListCoaches)
	r.Get("/seats/available", h.GetAvailableSeats)
	r.Post("/bookings", h.CreateBooking(mail))
	r.Get("/bookings/{id}", h.GetBooking)
	r.Delete("/bookings/{id}", h.CancelBooking)
	r.Post("/waitlist", h.CreateWaitlistEntry)
	r.Get("/admin/occupancy", h.GetOccupancy)
	r.Get("/admin/revenue", h.GetRevenue)

	log.Println("Server running on :3000")
	log.Fatal(http.ListenAndServe(":3000", r))
}
