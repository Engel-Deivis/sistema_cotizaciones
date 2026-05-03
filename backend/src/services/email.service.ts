import nodemailer from 'nodemailer'
import { Quote, Client, QuoteItem } from '@prisma/client'

type QuoteWithRelations = Quote & { client: Client; items: QuoteItem[] }

let transporter: nodemailer.Transporter | null = null

async function getTransporter() {
  if (transporter) return transporter

  // En desarrollo, crear cuenta Ethereal automáticamente si no hay credenciales
  if (!process.env.SMTP_USER) {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    console.log('📧 Email de prueba Ethereal:', testAccount.user)
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }

  return transporter
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount)
}

export async function sendQuoteToClient(quote: QuoteWithRelations) {
  const t = await getTransporter()

  const itemsHtml = quote.items
    .sort((a, b) => a.order - b.order)
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${item.description}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${formatCurrency(item.unitPrice, quote.currency)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${formatCurrency(item.total, quote.currency)}</td>
      </tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111">
      <h2 style="color:#6366f1">Cotización #${quote.number}</h2>
      <p>Estimado/a <strong>${quote.client.name}</strong>,</p>
      <p>Adjuntamos la cotización solicitada con los detalles a continuación:</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Descripción</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center">Cant.</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right">P. Unitario</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:8px;text-align:right;font-weight:bold">Subtotal:</td>
            <td style="padding:8px;text-align:right">${formatCurrency(quote.subtotal, quote.currency)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:8px;text-align:right;font-weight:bold">IVA (16%):</td>
            <td style="padding:8px;text-align:right">${formatCurrency(quote.tax, quote.currency)}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td colspan="3" style="padding:8px;text-align:right;font-weight:bold;font-size:1.1em">Total:</td>
            <td style="padding:8px;text-align:right;font-weight:bold;font-size:1.1em">${formatCurrency(quote.total, quote.currency)}</td>
          </tr>
        </tfoot>
      </table>

      ${quote.notes ? `<p><strong>Notas:</strong> ${quote.notes}</p>` : ''}
      ${quote.validUntil ? `<p><strong>Válida hasta:</strong> ${new Date(quote.validUntil).toLocaleDateString('es-MX')}</p>` : ''}

      <p>Para cualquier consulta, no dude en contactarnos.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
      <p style="color:#6b7280;font-size:0.9em">Sistema de Cotizaciones</p>
    </body>
    </html>
  `

  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@cotizaciones.dev',
    to: quote.client.email,
    subject: `Cotización #${quote.number} - ${quote.client.name}`,
    html,
  })

  // En desarrollo mostrar URL de previsualización
  if (!process.env.SMTP_USER) {
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info))
  }

  return info
}

export async function sendNewQuoteRequestNotification(
  adminEmail: string,
  clientName: string,
  clientEmail: string,
  quoteNumber: number
) {
  const t = await getTransporter()

  await t.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@cotizaciones.dev',
    to: adminEmail,
    subject: `Nueva solicitud de cotización #${quoteNumber} de ${clientName}`,
    html: `
      <h3>Nueva Solicitud de Cotización</h3>
      <p><strong>Cliente:</strong> ${clientName}</p>
      <p><strong>Email:</strong> ${clientEmail}</p>
      <p><strong>Cotización #:</strong> ${quoteNumber}</p>
      <p>Ingresa al panel de administración para revisar y procesar la solicitud.</p>
    `,
  })
}
