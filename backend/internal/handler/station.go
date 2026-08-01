package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nimashaklaa/train-seat-booking/internal/service"
)

func (h *Handler) ListStations(w http.ResponseWriter, r *http.Request) {
	routeID := r.URL.Query().Get("route_id")
	if routeID == "" {
		writeError(w, http.StatusBadRequest, "route_id is required")
		return
	}
	stations, err := h.svc.ListStations(r.Context(), routeID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, stations)
}

func (h *Handler) CreateStation(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RouteID              string `json:"route_id"`
		Name                 string `json:"name"`
		SequenceOrder        int32  `json:"sequence_order"`
		DistanceFromOriginKm string `json:"distance_from_origin_km"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	station, err := h.svc.CreateStation(r.Context(), service.StationInput{
		RouteID:              body.RouteID,
		Name:                 body.Name,
		SequenceOrder:        body.SequenceOrder,
		DistanceFromOriginKm: body.DistanceFromOriginKm,
	})
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, station)
}

func (h *Handler) UpdateStation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Name                 string `json:"name"`
		SequenceOrder        int32  `json:"sequence_order"`
		DistanceFromOriginKm string `json:"distance_from_origin_km"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	station, err := h.svc.UpdateStation(r.Context(), id, service.StationInput{
		Name:                 body.Name,
		SequenceOrder:        body.SequenceOrder,
		DistanceFromOriginKm: body.DistanceFromOriginKm,
	})
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, station)
}
