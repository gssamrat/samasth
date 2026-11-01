package essentials

import (
	"bufio"
	"fmt"
	"net"
	"strings"
)

// ESC/POS minimal helpers for network thermal printers

var (
	initPrinter   = []byte{0x1B, 0x40}
	alignLeft     = []byte{0x1B, 0x61, 0x00}
	alignCenter   = []byte{0x1B, 0x61, 0x01}
	alignRight    = []byte{0x1B, 0x61, 0x02}
	textNormal    = []byte{0x1B, 0x21, 0x00}
	textDoubleH   = []byte{0x1B, 0x21, 0x10}
	cutFull       = []byte{0x1D, 0x56, 0x00}
	lf            = []byte{0x0A}
	qrModel2      = []byte{0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00}
	qrSize4       = []byte{0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x04}
	qrErrorM      = []byte{0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x01}
)

type ESCPosPrinter struct {
	conn   net.Conn
	writer *bufio.Writer
}

func DialPrinter(address string) (*ESCPosPrinter, error) {
	conn, err := net.Dial("tcp", address)
	if err != nil {
		return nil, err
	}
	return &ESCPosPrinter{conn: conn, writer: bufio.NewWriter(conn)}, nil
}

func (p *ESCPosPrinter) Close() error {
	if p.writer != nil {
		p.writer.Flush()
	}
	if p.conn != nil {
		return p.conn.Close()
	}
	return nil
}

func (p *ESCPosPrinter) writeRaw(data ...[]byte) error {
	for _, d := range data {
		if len(d) == 0 {
			continue
		}
		if _, err := p.writer.Write(d); err != nil {
			return err
		}
	}
	return p.writer.Flush()
}

func (p *ESCPosPrinter) Init() error { return p.writeRaw(initPrinter) }
func (p *ESCPosPrinter) AlignCenter() error { return p.writeRaw(alignCenter) }
func (p *ESCPosPrinter) AlignLeft() error { return p.writeRaw(alignLeft) }
func (p *ESCPosPrinter) TextNormal() error { return p.writeRaw(textNormal) }
func (p *ESCPosPrinter) TextDoubleH() error { return p.writeRaw(textDoubleH) }
func (p *ESCPosPrinter) LF(lines int) error {
	for i := 0; i < lines; i++ {
		if err := p.writeRaw(lf); err != nil { return err }
	}
	return nil
}
func (p *ESCPosPrinter) Cut() error { return p.writeRaw(cutFull) }

// PrintText writes a single line of text followed by LF
func (p *ESCPosPrinter) PrintText(s string) error {
	// sanitize CRLF -> LF
	line := strings.ReplaceAll(s, "\r\n", "\n")
	line = strings.ReplaceAll(line, "\r", "\n")
	if _, err := p.writer.WriteString(line); err != nil { return err }
	return p.writer.Flush()
}

// PrintQR renders a QR code using ESC/POS model 2
func (p *ESCPosPrinter) PrintQR(data string) error {
	// store data
	b := []byte(data)
	lenLow := byte((len(b) + 3) & 0xFF)
	lenHigh := byte((len(b) + 3) >> 8)
	store := []byte{0x1D, 0x28, 0x6B, lenLow, lenHigh, 0x31, 0x50, 0x30}
	// print
	printCmd := []byte{0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30}
	return p.writeRaw(qrModel2, qrSize4, qrErrorM, store, b, printCmd)
}

// PrintCoupon prints a 3-inch layout for coupon with name, mobile and QR
func (p *ESCPosPrinter) PrintCoupon(title, name, mobile, code string) error {
	if err := p.Init(); err != nil { return err }
	if err := p.AlignCenter(); err != nil { return err }
	if err := p.TextDoubleH(); err != nil { return err }
	if err := p.PrintText(fmt.Sprintf("%s\n", title)); err != nil { return err }
	if err := p.TextNormal(); err != nil { return err }
	if err := p.LF(1); err != nil { return err }
	if err := p.PrintQR(code); err != nil { return err }
	if err := p.LF(2); err != nil { return err }
	if err := p.PrintText(fmt.Sprintf("Name: %s\n", name)); err != nil { return err }
	if err := p.PrintText(fmt.Sprintf("Mobile: %s\n", mobile)); err != nil { return err }
	if err := p.LF(2); err != nil { return err }
	if err := p.Cut(); err != nil { return err }
	return nil
}


