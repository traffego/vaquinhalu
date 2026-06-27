import MercadoPagoConfig, { Preference, Payment } from 'mercadopago'

export function getMercadoPagoClient(accessToken: string) {
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 }
  })
}

export interface DonationPreferenceData {
  donorName: string
  donorEmail: string
  amount: number
  donationId: string
  appUrl: string
}

export async function createDonationPreference(
  accessToken: string,
  data: DonationPreferenceData
) {
  const client = getMercadoPagoClient(accessToken)
  const preference = new Preference(client)

  const result = await preference.create({
    body: {
      items: [
        {
          id: data.donationId,
          title: `Doação Corrente do Bem - ${data.donorName}`,
          description: 'Doação para a cirurgia da Lucianinha',
          quantity: 1,
          unit_price: data.amount,
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: data.donorName,
        email: data.donorEmail,
      },
      back_urls: {
        success: `${data.appUrl}/doacao/sucesso`,
        failure: `${data.appUrl}/doacao/erro`,
        pending: `${data.appUrl}/doacao/pendente`,
      },
      auto_return: 'approved',
      notification_url: `${data.appUrl}/api/payment/webhook`,
      external_reference: data.donationId,
      statement_descriptor: 'CORRENTE DO BEM',
    },
  })

  return result
}

export interface DonationPixData {
  donorName: string
  donorPhone: string
  amount: number
  donationId: string
}

export async function createPixPayment(
  accessToken: string,
  data: DonationPixData
) {
  const client = getMercadoPagoClient(accessToken)
  const payment = new Payment(client)

  // Separar nome e sobrenome
  const nameParts = data.donorName.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || 'Doador'

  // Limpar telefone
  const cleanPhone = data.donorPhone.replace(/\D/g, '')
  const areaCode = cleanPhone.slice(0, 2) || '11'
  const number = cleanPhone.slice(2) || '999999999'

  const response = await payment.create({
    body: {
      transaction_amount: data.amount,
      description: 'Doação - Cirurgia Lucianinha',
      payment_method_id: 'pix',
      payer: {
        email: `doador_${cleanPhone}@correntedebem.com.br`,
        first_name: firstName,
        last_name: lastName,
        phone: {
          area_code: areaCode,
          number: number
        }
      },
      external_reference: data.donationId,
    }
  })

  return response
}

export async function getPaymentInfo(accessToken: string, paymentId: string) {
  const client = getMercadoPagoClient(accessToken)
  const payment = new Payment(client)
  return await payment.get({ id: paymentId })
}

