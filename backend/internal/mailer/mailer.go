package mailer

import (
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

func (m *Mailer) SendBookingConfirmation(data BookingConfirmationData) error {
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

	msg := buildMessage(m.from, data.PassengerEmail, subject, body)
	addr := m.host + ":" + m.port
	return smtp.SendMail(addr, nil, m.from, []string{data.PassengerEmail}, []byte(msg))
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
