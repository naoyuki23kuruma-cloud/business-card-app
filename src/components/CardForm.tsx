import { useState } from 'react'
import type { CardInput } from '../types/card'
import TagManager from './TagManager'

type Props = {
  initialData?: CardInput
  onSubmit: (data: CardInput) => Promise<void>
  submitLabel?: string
  loading?: boolean
}

type FormState = {
  name: string
  nameKana: string
  company: string
  department: string
  title: string
  email: string
  phone: string
  mobile: string
  fax: string
  address: string
  postalCode: string
  website: string
  exchangeDate: string
  exchangeLocation: string
  memo: string
  tags: string[]
}

export default function CardForm({ initialData, onSubmit, submitLabel = '保存', loading }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState<FormState>({
    name: initialData?.name ?? '',
    nameKana: initialData?.nameKana ?? '',
    company: initialData?.company ?? '',
    department: initialData?.department ?? '',
    title: initialData?.title ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    mobile: initialData?.mobile ?? '',
    fax: initialData?.fax ?? '',
    address: initialData?.address ?? '',
    postalCode: initialData?.postalCode ?? '',
    website: initialData?.website ?? '',
    exchangeDate: initialData?.exchangeDate
      ? new Date(initialData.exchangeDate).toISOString().split('T')[0]
      : today,
    exchangeLocation: initialData?.exchangeLocation ?? '',
    memo: initialData?.memo ?? '',
    tags: initialData?.tags ?? [],
  })

  const set =
    (key: keyof Omit<FormState, 'tags'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...form,
      exchangeDate: form.exchangeDate ? new Date(form.exchangeDate).toISOString() : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">人物情報</h3>
        <Field label="氏名" value={form.name} onChange={set('name')} />
        <Field label="氏名カナ" value={form.nameKana} onChange={set('nameKana')} />
        <Field label="会社名" value={form.company} onChange={set('company')} />
        <Field label="部署" value={form.department} onChange={set('department')} />
        <Field label="役職" value={form.title} onChange={set('title')} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">連絡先</h3>
        <Field label="メール" type="email" value={form.email} onChange={set('email')} />
        <Field label="電話番号" type="tel" value={form.phone} onChange={set('phone')} />
        <Field label="携帯番号" type="tel" value={form.mobile} onChange={set('mobile')} />
        <Field label="FAX" type="tel" value={form.fax} onChange={set('fax')} />
        <Field label="郵便番号" value={form.postalCode} onChange={set('postalCode')} />
        <Field label="住所" value={form.address} onChange={set('address')} />
        <Field label="Webサイト" type="url" value={form.website} onChange={set('website')} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">名刺交換情報</h3>
        <Field label="交換日" type="date" value={form.exchangeDate} onChange={set('exchangeDate')} />
        <Field label="交換場所・イベント" value={form.exchangeLocation} onChange={set('exchangeLocation')} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">タグ・メモ</h3>
        <div>
          <label className="block text-sm text-gray-700 mb-1">タグ</label>
          <TagManager tags={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">メモ</label>
          <textarea
            value={form.memo}
            onChange={set('memo')}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '保存中...' : submitLabel}
      </button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  )
}
