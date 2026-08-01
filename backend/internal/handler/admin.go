package handler

import (
	"fmt"
	"net/http"
)

type occupancyResponse struct {
	JourneyID         string `json:"journey_id"`
	TotalBookings     int    `json:"total_bookings"`
	ConfirmedBookings int    `json:"confirmed_bookings"`
	CancelledBookings int    `json:"cancelled_bookings"`
}

type revenueResponse struct {
	JourneyID string  `json:"journey_id"`
	Revenue   float64 `json:"revenue"`
}

// GET /admin/occupancy?journey_id=
func (h *Handler) GetOccupancy(w http.ResponseWriter, r *http.Request) {
	journeyID := r.URL.Query().Get("journey_id")
	if journeyID == "" {
		writeError(w, http.StatusBadRequest, "journey_id is required")
		return
	}

	bookings, err := h.queries.ListBookingsByJourney(r.Context(), journeyID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get bookings")
		return
	}

	resp := occupancyResponse{JourneyID: journeyID}
	for _, b := range bookings {
		resp.TotalBookings++
		switch b.Status {
		case "CONFIRMED":
			resp.ConfirmedBookings++
		case "CANCELLED":
			resp.CancelledBookings++
		}
	}
	writeJSON(w, http.StatusOK, resp)
}

// GET /admin/revenue?journey_id=
func (h *Handler) GetRevenue(w http.ResponseWriter, r *http.Request) {
	journeyID := r.URL.Query().Get("journey_id")
	if journeyID == "" {
		writeError(w, http.StatusBadRequest, "journey_id is required")
		return
	}

	bookings, err := h.queries.ListBookingsByJourney(r.Context(), journeyID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get bookings")
		return
	}

	var total float64
	for _, b := range bookings {
		if b.Status == "CONFIRMED" {
			var fare float64
			if _, err := fmt.Sscanf(b.Fare, "%f", &fare); err == nil {
				total += fare
			}
		}
	}
	writeJSON(w, http.StatusOK, revenueResponse{
		JourneyID: journeyID,
		Revenue:   total,
	})
}
