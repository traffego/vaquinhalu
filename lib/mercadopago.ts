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

export async function getPaymentInfo(accessToken: string, paymentId: string) {
  const client = getMercadoPagoClient(accessToken)
  const payment = new Payment(client)
  return await payment.get({ id: paymentId })
}
