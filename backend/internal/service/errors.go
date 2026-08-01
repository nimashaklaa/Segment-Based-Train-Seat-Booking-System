package service

import "errors"

// Sentinel errors that handlers map to HTTP status codes.
var (
	ErrNotFound  = errors.New("not found")
	ErrForbidden = errors.New("forbidden")
	ErrConflict  = errors.New("conflict")
	ErrInvalid   = errors.New("invalid input")
)
