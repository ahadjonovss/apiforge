import type { RequestError, RequestErrorKind } from '../domain/response'

interface Descriptor {
  kind: RequestErrorKind
  title: string
  message: (host: string) => string
  hint: string
}

const BY_CODE: Record<string, Descriptor> = {
  ENOTFOUND: {
    kind: 'dns',
    title: 'Domen topilmadi',
    message: (host) => `«${host}» degan manzil mavjud emas`,
    hint: "Manzilda xato bormi tekshiring. Agar endpoint to'plamdan base URL olayotgan bo'lsa, o'sha sozlamani ko'ring.",
  },
  EAI_AGAIN: {
    kind: 'dns',
    title: 'DNS javob bermadi',
    message: (host) => `«${host}» nomini aniqlab bo'lmadi`,
    hint: 'Internet aloqangizni yoki DNS sozlamangizni tekshiring.',
  },
  ECONNREFUSED: {
    kind: 'refused',
    title: 'Ulanish rad etildi',
    message: (host) => `«${host}» ulanishni qabul qilmadi`,
    hint: "Server ishlab turibdimi va port to'g'rimi tekshiring. Lokal server bo'lsa, uni ishga tushiring.",
  },
  ECONNRESET: {
    kind: 'network',
    title: 'Aloqa uzildi',
    message: (host) => `«${host}» ulanishni yarim yo'lda uzdi`,
    hint: 'Qayta urinib ko‘ring. Takrorlansa, server tomonida muammo bo‘lishi mumkin.',
  },
  EPIPE: {
    kind: 'network',
    title: 'Aloqa uzildi',
    message: () => "So'rov to'liq yuborilmadi",
    hint: 'Qayta urinib ko‘ring.',
  },
  ETIMEDOUT: {
    kind: 'timeout',
    title: 'Vaqt tugadi',
    message: (host) => `«${host}» belgilangan vaqtda javob bermadi`,
    hint: 'Server sekin bo‘lishi mumkin. Qayta urinib ko‘ring.',
  },
  UND_ERR_CONNECT_TIMEOUT: {
    kind: 'timeout',
    title: 'Ulanish vaqti tugadi',
    message: (host) => `«${host}» ga ulanib bo'lmadi`,
    hint: 'Server yoki tarmoq javob bermayapti.',
  },
  EHOSTUNREACH: {
    kind: 'unreachable',
    title: 'Manzilga yetib bo‘lmadi',
    message: (host) => `«${host}» tarmoqdan ko'rinmayapti`,
    hint: 'Ichki tarmoq manzili bo‘lsa, VPN yoki tarmoqqa ulanganingizni tekshiring.',
  },
  ENETUNREACH: {
    kind: 'unreachable',
    title: 'Tarmoq mavjud emas',
    message: () => 'Tarmoqqa chiqib bo‘lmadi',
    hint: 'Internet aloqangizni tekshiring.',
  },
  CERT_HAS_EXPIRED: {
    kind: 'tls',
    title: 'Sertifikat muddati tugagan',
    message: (host) => `«${host}» sertifikati eskirgan`,
    hint: 'Server sertifikatini yangilash kerak.',
  },
  DEPTH_ZERO_SELF_SIGNED_CERT: {
    kind: 'tls',
    title: 'Ishonchsiz sertifikat',
    message: (host) => `«${host}» o'zi imzolagan sertifikatdan foydalanmoqda`,
    hint: 'Test serverlarida uchraydi. Ishonchli sertifikat o‘rnatilishi kerak.',
  },
  SELF_SIGNED_CERT_IN_CHAIN: {
    kind: 'tls',
    title: 'Ishonchsiz sertifikat',
    message: (host) => `«${host}» sertifikat zanjiri tekshirilmadi`,
    hint: 'Korporativ proksi yoki test sertifikati sabab bo‘lishi mumkin.',
  },
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: {
    kind: 'tls',
    title: 'Sertifikat tekshirilmadi',
    message: (host) => `«${host}» sertifikatiga ishonib bo'lmadi`,
    hint: 'Oraliq sertifikat yetishmayotgan bo‘lishi mumkin.',
  },
  EPROTO: {
    kind: 'tls',
    title: 'TLS xatosi',
    message: (host) => `«${host}» bilan xavfsiz ulanish o'rnatilmadi`,
    hint: 'Manzil http:// bo‘lishi kerakmi tekshiring.',
  },
}

const UNKNOWN: Descriptor = {
  kind: 'network',
  title: "So'rov yetib bormadi",
  message: (host) => (host ? `«${host}» bilan aloqa o'rnatilmadi` : 'Tarmoq xatosi'),
  hint: 'Manzilni va internet aloqangizni tekshiring.',
}

export interface NetworkErrorInput {
  code: string | null
  raw: string
  host: string
  viaProxy: boolean
  durationMs: number
}

export function describeNetworkError({
  code,
  host,
  viaProxy,
  durationMs,
}: NetworkErrorInput): RequestError {
  if (!viaProxy) {
    return {
      kind: 'cors',
      title: "Brauzer so'rovni bloklagan",
      message: `«${host}» javobini brauzer o'qishga ruxsat bermadi (${durationMs}ms)`,
      hint: "Ko'pincha bu CORS. Dev server'da proxy shu muammoni hal qiladi; deploy qilingan ilova uchun Cloud Function relay kerak.",
    }
  }

  const descriptor = (code && BY_CODE[code]) || UNKNOWN

  return {
    kind: descriptor.kind,
    title: descriptor.title,
    message: `${descriptor.message(host)} (${durationMs}ms)`,
    hint: descriptor.hint,
  }
}

export function describeRawError(raw: string, durationMs: number): RequestError {
  return {
    kind: 'unknown',
    title: "So'rov bajarilmadi",
    message: `${raw} (${durationMs}ms)`,
  }
}
