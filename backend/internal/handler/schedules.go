package handler

import (
	"net/http"
	"time"
)

func (h *Handler) ListSchedules(w http.ResponseWriter, r *http.Request) {
	routeID := r.URL.Query().Get("route_id")
	if routeID == "" {
		writeError(w, http.StatusBadRequest, "route_id is required")
		return
	}
	schedules, err := h.svc.ListSchedulesByRoute(r.Context(), routeID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, schedules)
}

func (h *Handler) ListJourneys(w http.ResponseWriter, r *http.Request) {
	dateStr := r.URL.Query().Get("date")
	var date time.Time
	if dateStr == "" {
		date = time.Now().UTC().Truncate(24 * time.Hour)
	} else {
		var err error
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			writeError(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
			return
		}
	}
	journeys, err := h.svc.ListJourneysByDate(r.Context(), date)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, journeys)
}
