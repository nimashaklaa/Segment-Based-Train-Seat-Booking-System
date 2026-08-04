package mailer

import (
	"context"
	"fmt"
	"net/smtp"
	"strings"
)

type Mailer struct {
	host string
	port string
	from string
}

func New(host, port, from string) *Mailer {
	return &Mailer{host: host, port: port, from: from}
}

type BookingConfirmationData struct {
	PassengerName  string
	PassengerEmail string
	BookingID      string
	JourneyID      string
	SeatID         string
	BoardStation   string
	AlightStation  string
	Fare           string
}

func sanitize(s string) string {
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	return s
}

func (m *Mailer) SendBookingConfirmation(ctx context.Context, data BookingConfirmationData) error {
	subject := "Your Train Booking Confirmation"
	body := fmt.Sprintf(`Hello %s,

Your booking has been confirmed. Here are your details:

  Booking Reference : %s
  Journey ID        : %s
  Seat ID           : %s
  From              : %s
  To                : %s
  Fare              : $%s

To view or manage your booking, use your booking reference and this email address.

Thank you for travelling with us!
`, data.PassengerName, data.BookingID, data.JourneyID, data.SeatID,
		data.BoardStation, data.AlightStation, data.Fare)

	msg := buildMessage(sanitize(m.from), sanitize(data.PassengerEmail), sanitize(subject), body)
	addr := m.host + ":" + m.port
	return smtp.SendMail(addr, nil, sanitize(m.from), []string{sanitize(data.PassengerEmail)}, []byte(msg))
}

type WaitlistNotificationData struct {
	PassengerName  string
	PassengerEmail string
	BoardStation   string
	AlightStation  string
	JourneyID      string
}

func (m *Mailer) SendWaitlistNotification(ctx context.Context, data WaitlistNotificationData) error {
	subject := "Seat Available — Your Waitlisted Journey"
	body := fmt.Sprintf(`Hello %s,

Good news! A seat has become available for your waitlisted journey segment:

  From  : %s
  To    : %s

Please visit the booking site as soon as possible to secure your seat.
Availability is not guaranteed — seats are first-come, first-served once notified.

Thank you for your patience!
`, data.PassengerName, data.BoardStation, data.AlightStation)

	msg := buildMessage(sanitize(m.from), sanitize(data.PassengerEmail), sanitize(subject), body)
	addr := m.host + ":" + m.port
	return smtp.SendMail(addr, nil, sanitize(m.from), []string{sanitize(data.PassengerEmail)}, []byte(msg))
}

func buildMessage(from, to, subject, body string) string {
	var sb strings.Builder
	sb.WriteString("From: " + from + "\r\n")
	sb.WriteString("To: " + to + "\r\n")
	sb.WriteString("Subject: " + subject + "\r\n")
	sb.WriteString("MIME-Version: 1.0\r\n")
	sb.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	sb.WriteString("\r\n")
	sb.WriteString(body)
	return sb.String()
}
