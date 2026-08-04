package handler

import (
	"log"
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/service"
)

// GET /admin/occupancy?journey_id=   (omit journey_id to get all)
func (h *Handler) GetOccupancy(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if journeyID := r.URL.Query().Get("journey_id"); journeyID != "" {
		result, err := h.svc.GetOccupancy(ctx, journeyID)
		if err != nil {
			mapServiceError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, []service.OccupancyResult{result})
		return
	}

	journeys, err := h.svc.ListAllJourneys(ctx)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	results := make([]service.OccupancyResult, 0, len(journeys))
	for _, j := range journeys {
		res, err := h.svc.GetOccupancy(ctx, j.ID)
		if err != nil {
			log.Printf("failed to get occupancy for journey %s: %v", j.ID, err)
			continue
		}
		results = append(results, res)
	}
	writeJSON(w, http.StatusOK, results)
}

// GET /admin/revenue?journey_id=   (omit journey_id to get all)
func (h *Handler) GetRevenue(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if journeyID := r.URL.Query().Get("journey_id"); journeyID != "" {
		result, err := h.svc.GetRevenue(ctx, journeyID)
		if err != nil {
			mapServiceError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, []service.RevenueResult{result})
		return
	}

	journeys, err := h.svc.ListAllJourneys(ctx)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	results := make([]service.RevenueResult, 0, len(journeys))
	for _, j := range journeys {
		res, err := h.svc.GetRevenue(ctx, j.ID)
		if err != nil {
			log.Printf("failed to get revenue for journey %s: %v", j.ID, err)
			continue
		}
		results = append(results, res)
	}
	writeJSON(w, http.StatusOK, results)
}
