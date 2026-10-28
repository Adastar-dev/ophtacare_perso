// File d'attente hors-ligne : IndexedDB pour les mutations API (consultations).
// Les requêtes en attente sont relayées au serveur dès la reconnexion.

export interface PendingRequest {
  id: string
  method: string
  path: string
  body: unknown
  prescription?: unknown
  token: string
  created_at: string
  label: string
}

const DB_NAME = 'ophtacare-offline'
const STORE = 'queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueue(item: PendingRequest): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function dequeue(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueue(): Promise<PendingRequest[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as PendingRequest[])
    req.onerror = () => reject(req.error)
  })
}

export async function processQueue(baseUrl: string, token: string): Promise<number> {
  const items = await getQueue()
  let synced = 0
  for (const item of items) {
    const authToken = item.token || token
    try {
      const res = await fetch(`${baseUrl}${item.path}`, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(item.body),
      })
      if (!res.ok) continue

      // Créer l'ordonnance associée si présente (consultation POST uniquement)
      if (item.prescription && item.method === 'POST' && item.path === '/consultations') {
        const { consultation } = await res.json() as { consultation?: { id: number } }
        if (consultation?.id) {
          await fetch(`${baseUrl}/prescriptions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ consultation_id: consultation.id, ...(item.prescription as object) }),
          }).catch(() => {})
        }
      }

      await dequeue(item.id)
      synced++
    } catch {
      break // toujours hors-ligne, on arrête
    }
  }
  return synced
}
