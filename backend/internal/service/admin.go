package service

import (
	"context"
	"fmt"
)

type OccupancyResult struct {
	JourneyID         string `json:"journey_id"`
	TotalBookings     int    `json:"total_bookings"`
	ConfirmedBookings int    `json:"confirmed_bookings"`
	CancelledBookings int    `json:"cancelled_bookings"`
}

type RevenueResult struct {
	JourneyID string  `json:"journey_id"`
	Revenue   float64 `json:"revenue"`
}

func (s *Service) GetOccupancy(ctx context.Context, journeyID string) (OccupancyResult, error) {
	bookings, err := s.queries.ListBookingsByJourney(ctx, journeyID)
	if err != nil {
		return OccupancyResult{}, err
	}

	result := OccupancyResult{JourneyID: journeyID}
	for _, b := range bookings {
		result.TotalBookings++
		switch b.Status {
		case "CONFIRMED":
			result.ConfirmedBookings++
		case "CANCELLED":
			result.CancelledBookings++
		}
	}
	return result, nil
}

func (s *Service) GetRevenue(ctx context.Context, journeyID string) (RevenueResult, error) {
	bookings, err := s.queries.ListBookingsByJourney(ctx, journeyID)
	if err != nil {
		return RevenueResult{}, err
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
	return RevenueResult{JourneyID: journeyID, Revenue: total}, nil
}
