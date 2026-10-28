"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Erreur, PageHeader } from "@/components/page-states"
import { Loader2, Save } from "lucide-react"
import { updatePassword, updateProfil } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api"

export default function ParametresPage() {
  const { user, setUser } = useAuth()
  const [profil, setProfil] = useState({
    titre: user?.titre ?? "Dr",
    name: user?.name ?? "",
    specialite: user?.specialite ?? "",
    numero_ordre: user?.numero_ordre ?? "",
    telephone: user?.telephone ?? "",
    email: user?.email ?? "",
  })
  const [savingProfil, setSavingProfil] = useState(false)
  const [errProfil, setErrProfil] = useState("")

  const [mdp, setMdp] = useState({ current_password: "", password: "", password_confirmation: "" })
  const [savingMdp, setSavingMdp] = useState(false)
  const [errMdp, setErrMdp] = useState("")

  const inputCls = "text-base sm:text-sm"

  const enregistrerProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfil(true); setErrProfil("")
    try {
      const res = await updateProfil({
        ...profil,
        titre: profil.titre.trim() || null,
        specialite: profil.specialite.trim() || null,
        numero_ordre: profil.numero_ordre.trim() || null,
        telephone: profil.telephone.trim() || null,
      })
      setUser(res.user)
      toast.success("Profil enregistré")
    } catch (err) {
      setErrProfil(err instanceof ApiError ? err.message : "Erreur")
    } finally {
      setSavingProfil(false)
    }
  }

  const changerMdp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mdp.password !== mdp.password_confirmation) { setErrMdp("Les deux mots de passe ne correspondent pas."); return }
    setSavingMdp(true); setErrMdp("")
    try {
      const res = await updatePassword(mdp)
      toast.success(res.message)
      setMdp({ current_password: "", password: "", password_confirmation: "" })
    } catch (err) {
      setErrMdp(err instanceof ApiError ? err.message : "Erreur")
    } finally {
      setSavingMdp(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Paramètres" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes informations</CardTitle>
          <CardDescription>Elles apparaissent en en-tête de vos ordonnances, avec le lieu de la consultation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enregistrerProfil} className="space-y-4">
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="titre">Titre</Label>
                <Input id="titre" value={profil.titre} onChange={(e) => setProfil({ ...profil, titre: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" value={profil.name} onChange={(e) => setProfil({ ...profil, name: e.target.value })} className={inputCls} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="spe">Spécialité</Label>
                <Input id="spe" value={profil.specialite} onChange={(e) => setProfil({ ...profil, specialite: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ordre">N° d&apos;ordre</Label>
                <Input id="ordre" value={profil.numero_ordre} onChange={(e) => setProfil({ ...profil, numero_ordre: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tel">Téléphone</Label>
                <Input id="tel" type="tel" value={profil.telephone} onChange={(e) => setProfil({ ...profil, telephone: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mail">Email de connexion</Label>
                <Input id="mail" type="email" autoCapitalize="none" value={profil.email} onChange={(e) => setProfil({ ...profil, email: e.target.value })} className={inputCls} required />
              </div>
            </div>
            {errProfil && <Erreur message={errProfil} />}
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfil}>
                {savingProfil ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mot de passe</CardTitle>
          <CardDescription>Après le changement, vos autres appareils devront se reconnecter.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changerMdp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur">Mot de passe actuel</Label>
              <Input id="cur" type="password" autoComplete="current-password" value={mdp.current_password} onChange={(e) => setMdp({ ...mdp, current_password: e.target.value })} className={inputCls} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new">Nouveau (8 caractères min.)</Label>
                <Input id="new" type="password" autoComplete="new-password" minLength={8} value={mdp.password} onChange={(e) => setMdp({ ...mdp, password: e.target.value })} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conf">Confirmer</Label>
                <Input id="conf" type="password" autoComplete="new-password" minLength={8} value={mdp.password_confirmation} onChange={(e) => setMdp({ ...mdp, password_confirmation: e.target.value })} className={inputCls} required />
              </div>
            </div>
            {errMdp && <Erreur message={errMdp} />}
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={savingMdp}>
                {savingMdp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Changer le mot de passe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
