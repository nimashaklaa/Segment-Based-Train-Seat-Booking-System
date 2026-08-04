package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// ── Routes ──────────────────────────────────────────────────────────────────

func (h *Handler) ListRoutes(w http.ResponseWriter, r *http.Request) {
	routes, err := h.svc.ListRoutes(r.Context())
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, routes)
}

func (h *Handler) CreateRoute(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name        string `json:"name"`
		Code        string `json:"code"`
		Origin      string `json:"origin"`
		Destination string `json:"destination"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	route, err := h.svc.CreateRoute(r.Context(), body.Name, body.Code, body.Origin, body.Destination)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, route)
}

func (h *Handler) UpdateRoute(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Name        string `json:"name"`
		Code        string `json:"code"`
		Origin      string `json:"origin"`
		Destination string `json:"destination"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	route, err := h.svc.UpdateRoute(r.Context(), id, body.Name, body.Code, body.Origin, body.Destination)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, route)
}

// ── Schedules ────────────────────────────────────────────────────────────────

func (h *Handler) ListAllSchedules(w http.ResponseWriter, r *http.Request) {
	schedules, err := h.svc.ListSchedules(r.Context())
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, schedules)
}

func (h *Handler) CreateSchedule(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TrainNumber   string `json:"train_number"`
		TrainName     string `json:"train_name"`
		RouteID       string `json:"route_id"`
		DepartureTime string `json:"departure_time"` // "HH:MM"
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	sc, err := h.svc.CreateSchedule(r.Context(), body.TrainNumber, body.TrainName, body.RouteID, body.DepartureTime)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, sc)
}

func (h *Handler) UpdateSchedule(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		TrainNumber   string `json:"train_number"`
		TrainName     string `json:"train_name"`
		DepartureTime string `json:"departure_time"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	sc, err := h.svc.UpdateSchedule(r.Context(), id, body.TrainNumber, body.TrainName, body.DepartureTime)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, sc)
}

func (h *Handler) DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteSchedule(r.Context(), id); err != nil {
		mapServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ── Journeys ─────────────────────────────────────────────────────────────────

func (h *Handler) ListAllJourneys(w http.ResponseWriter, r *http.Request) {
	journeys, err := h.svc.ListAllJourneys(r.Context())
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, journeys)
}

func (h *Handler) CreateJourney(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ScheduleID string `json:"schedule_id"`
		TravelDate string `json:"travel_date"` // "YYYY-MM-DD"
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	j, err := h.svc.CreateJourney(r.Context(), body.ScheduleID, body.TravelDate)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, j)
}

func (h *Handler) UpdateJourneyStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	j, err := h.svc.UpdateJourneyStatus(r.Context(), id, body.Status)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, j)
}

// ── Coaches ──────────────────────────────────────────────────────────────────

func (h *Handler) ListAllCoaches(w http.ResponseWriter, r *http.Request) {
	coaches, err := h.svc.ListAllCoaches(r.Context())
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, coaches)
}

func (h *Handler) ListCoachTypes(w http.ResponseWriter, r *http.Request) {
	types, err := h.svc.ListCoachTypes(r.Context())
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, types)
}

func (h *Handler) CreateCoach(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CoachNumber string `json:"coach_number"`
		CoachTypeID string `json:"coach_type_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	c, err := h.svc.CreateCoach(r.Context(), body.CoachNumber, body.CoachTypeID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (h *Handler) UpdateCoachType(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		FareMultiplier float64 `json:"fare_multiplier"`
		SeatCapacity   int     `json:"seat_capacity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	ct, err := h.svc.UpdateCoachType(r.Context(), id, body.FareMultiplier, body.SeatCapacity)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, ct)
}

func (h *Handler) DeleteCoach(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteCoach(r.Context(), id); err != nil {
		mapServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
